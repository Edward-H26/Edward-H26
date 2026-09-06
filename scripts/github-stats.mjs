// Reads public GitHub data for the dynamic cards and turns it into plain numbers. Fetching is
// isolated in fetchGithub so everything else can be tested with fixtures.
const STATS_QUERY = `query($login: String!) {
  user(login: $login) {
    name
    login
    followers { totalCount }
    repositories(first: 100, ownerAffiliations: OWNER, privacy: PUBLIC, orderBy: { field: STARGAZERS, direction: DESC }) {
      totalCount
      nodes {
        name
        stargazerCount
        forkCount
        isFork
        primaryLanguage { name color }
        languages(first: 8, orderBy: { field: SIZE, direction: DESC }) { edges { size node { name color } } }
      }
    }
    contributionsCollection {
      commitContributionsByRepository(maxRepositories: 6) {
        repository { name primaryLanguage { name color } }
        contributions { totalCount }
      }
      totalCommitContributions
      totalPullRequestContributions
      totalIssueContributions
      totalPullRequestReviewContributions
      contributionCalendar { totalContributions weeks { contributionDays { date contributionCount } } }
    }
  }
}`

const safeColor = (color, fallback = "#8b949e") => (/^#[0-9a-f]{6}$/i.test(color ?? "") ? color : fallback)

async function request(url, token, init = {}) {
  const response = await fetch(url, {
    ...init,
    headers: { Authorization: `bearer ${token}`, "User-Agent": "profile-assets", Accept: "application/vnd.github+json", ...(init.headers ?? {}) }
  })
  if (!response.ok) throw new Error(`${url} answered ${response.status}: ${(await response.text()).slice(0, 200)}`)
  return response.json()
}

export async function fetchGithub(login, token) {
  const graphql = await request("https://api.github.com/graphql", token, { method: "POST", body: JSON.stringify({ query: STATS_QUERY, variables: { login } }) })
  if (graphql.errors) throw new Error(`GraphQL: ${JSON.stringify(graphql.errors).slice(0, 300)}`)
  const user = graphql.data.user
  const repos = user.repositories.nodes.filter((repo) => !repo.isFork).map((repo) => repo.name)
  return { capturedAt: new Date().toISOString(), user, codeStats: await fetchCodeStats(login, token, repos) }
}

// GitHub computes contributor statistics lazily and answers 202 until they are ready.
async function requestStats(url, token) {
  for (let attempt = 0; attempt < 8; attempt += 1) {
    const response = await fetch(url, { headers: { Authorization: `bearer ${token}`, "User-Agent": "profile-assets", Accept: "application/vnd.github+json" } })
    if (response.status === 202) {
      await new Promise((resolve) => setTimeout(resolve, 3000))
      continue
    }
    if (response.status === 204) return []
    if (!response.ok) throw new Error(`${url} answered ${response.status}`)
    return response.json()
  }
  return []
}

// The user's own weekly lines added, deleted, and commits per repository; only weeks with
// activity are kept, so fixtures stay small.
export async function fetchCodeStats(login, token, repos) {
  const stats = {}
  for (const repo of repos) {
    const contributors = await requestStats(`https://api.github.com/repos/${login}/${repo}/stats/contributors`, token)
    const own = (Array.isArray(contributors) ? contributors : []).find((entry) => entry.author?.login === login)
    if (own) stats[repo] = own.weeks.filter((week) => week.a || week.d || week.c).map((week) => ({ w: week.w, a: week.a, d: week.d, c: week.c }))
  }
  return stats
}

export function calendarDays(user) {
  return user.contributionsCollection.contributionCalendar.weeks.flatMap((week) => week.contributionDays).map((day) => ({ date: day.date, count: day.contributionCount }))
}

// Streaks follow GitHub's convention: a current streak is still alive when today has no
// contribution yet, as long as yesterday had one.
export function computeStreaks(days, today) {
  const sorted = [...days].sort((a, b) => a.date.localeCompare(b.date))
  let longest = 0
  let run = 0
  for (const day of sorted) {
    run = day.count > 0 ? run + 1 : 0
    longest = Math.max(longest, run)
  }
  let current = 0
  for (let i = sorted.length - 1; i >= 0; i -= 1) {
    const day = sorted[i]
    if (day.date > today) continue
    if (day.count > 0) current += 1
    else if (day.date === today && current === 0) continue
    else break
  }
  return { current, longest }
}

export function topLanguages(nodes, limit = 6) {
  const totals = new Map()
  for (const repo of nodes) {
    if (repo.isFork) continue
    for (const edge of repo.languages?.edges ?? []) {
      const entry = totals.get(edge.node.name) ?? { name: edge.node.name, color: safeColor(edge.node.color), size: 0 }
      entry.size += edge.size
      totals.set(edge.node.name, entry)
    }
  }
  const ranked = [...totals.values()].sort((a, b) => b.size - a.size)
  const sum = ranked.reduce((acc, entry) => acc + entry.size, 0) || 1
  return ranked.slice(0, limit).map((entry) => ({ name: entry.name, color: entry.color, share: Math.round((entry.size / sum) * 1000) / 10 }))
}

export function commitsByRepository(contributions) {
  return (contributions.commitContributionsByRepository ?? [])
    .map((entry) => ({ name: entry.repository.name, commits: entry.contributions.totalCount, color: safeColor(entry.repository.primaryLanguage?.color) }))
    .filter((entry) => entry.commits > 0)
    .sort((a, b) => b.commits - a.commits || a.name.localeCompare(b.name))
}

const WEEK = 7 * 86400

// Lines the user pushed in the past year: totals, the busiest repositories, and one entry per
// week (GitHub's weeks start on Sunday, UTC) with gaps filled in.
export function codeSummary(codeStats = {}, nodes = [], now = new Date()) {
  const sunday = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - now.getUTCDay()) / 1000
  const since = sunday - 51 * WEEK
  const colors = new Map(nodes.map((repo) => [repo.name, safeColor(repo.primaryLanguage?.color)]))
  const weekly = new Map()
  const byRepo = []
  for (const [name, weeks] of Object.entries(codeStats)) {
    const repo = { name, added: 0, deleted: 0, commits: 0, color: colors.get(name) ?? "#8b949e" }
    for (const week of weeks) {
      if (week.w < since || week.w > sunday) continue
      repo.added += week.a
      repo.deleted += week.d
      repo.commits += week.c
      const slot = weekly.get(week.w) ?? { week: week.w, added: 0, deleted: 0, commits: 0 }
      slot.added += week.a
      slot.deleted += week.d
      slot.commits += week.c
      weekly.set(week.w, slot)
    }
    if (repo.added + repo.deleted > 0) byRepo.push(repo)
  }
  byRepo.sort((a, b) => b.added + b.deleted - (a.added + a.deleted) || a.name.localeCompare(b.name))
  const weeks = Array.from({ length: 52 }, (_, i) => weekly.get(since + i * WEEK) ?? { week: since + i * WEEK, added: 0, deleted: 0, commits: 0 })
  const sum = (key) => weeks.reduce((acc, week) => acc + week[key], 0)
  return { added: sum("added"), deleted: sum("deleted"), commits: sum("commits"), byRepo: byRepo.slice(0, 6), weeks }
}

export function summarize({ user, codeStats }, now = new Date()) {
  const today = now.toISOString().slice(0, 10)
  const days = calendarDays(user)
  const nodes = user.repositories.nodes
  const contributions = user.contributionsCollection
  return {
    name: user.name ?? user.login,
    login: user.login,
    updated: today,
    followers: user.followers.totalCount,
    repos: user.repositories.totalCount,
    stars: nodes.reduce((acc, repo) => acc + repo.stargazerCount, 0),
    forks: nodes.reduce((acc, repo) => acc + repo.forkCount, 0),
    commits: contributions.totalCommitContributions,
    pullRequests: contributions.totalPullRequestContributions,
    issues: contributions.totalIssueContributions,
    reviews: contributions.totalPullRequestReviewContributions,
    total: contributions.contributionCalendar.totalContributions,
    streak: computeStreaks(days, today),
    languages: topLanguages(nodes),
    repositoriesByCommits: commitsByRepository(contributions),
    code: codeSummary(codeStats, nodes, now)
  }
}
