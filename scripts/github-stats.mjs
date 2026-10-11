// Reads public GitHub data for the dynamic cards and turns it into plain numbers. Fetching is
// isolated in fetchGithub so everything else can be tested with fixtures.
const STATS_QUERY = `query($login: String!) {
  user(login: $login) {
    name
    login
    createdAt
    followers { totalCount }
    repositories(first: 100, ownerAffiliations: OWNER, privacy: PUBLIC, orderBy: { field: STARGAZERS, direction: DESC }) {
      totalCount
      nodes {
        name
        stargazerCount
        forkCount
        isFork
        primaryLanguage { name color }
        languages(first: 8, orderBy: { field: SIZE, direction: DESC }) { edges { size node { name } } }
      }
    }
    contributionsCollection {
      contributionYears
      commitContributionsByRepository(maxRepositories: 6) {
        repository { name primaryLanguage { name color } }
        contributions { totalCount }
      }
    }
  }
}`

// GitHub caps one contributionsCollection at a year, so the all-time numbers come from one window
// per calendar year since the account was created. Repository names are left out on purpose: the
// totals and languages need none, and a local run with a personal token must not write private
// repository names into the committed fixture.
const YEAR_FIELDS = `
  totalCommitContributions
  totalIssueContributions
  totalPullRequestContributions
  totalPullRequestReviewContributions
  totalRepositoryContributions
  commitContributionsByRepository(maxRepositories: 100) { repository { primaryLanguage { name } } contributions { totalCount } }
  contributionCalendar { totalContributions weeks { contributionDays { date contributionCount } } }`

const safeColor = (color, fallback = "#8b949e") => (/^#[0-9a-f]{6}$/i.test(color ?? "") ? color : fallback)

async function request(url, token, init = {}) {
  const response = await fetch(url, {
    ...init,
    headers: { Authorization: `bearer ${token}`, "User-Agent": "profile-assets", Accept: "application/vnd.github+json", ...(init.headers ?? {}) }
  })
  if (!response.ok) throw new Error(`${url} answered ${response.status}: ${(await response.text()).slice(0, 200)}`)
  return response.json()
}

async function graphqlUser(query, login, token) {
  const graphql = await request("https://api.github.com/graphql", token, { method: "POST", body: JSON.stringify({ query, variables: { login } }) })
  if (graphql.errors) throw new Error(`GraphQL: ${JSON.stringify(graphql.errors).slice(0, 300)}`)
  return graphql.data.user
}

export async function fetchGithub(login, token) {
  const now = new Date()
  const user = await graphqlUser(STATS_QUERY, login, token)
  const repos = user.repositories.nodes.filter((repo) => !repo.isFork).map((repo) => repo.name)
  const history = await fetchHistory(login, token, user.contributionsCollection.contributionYears, now)
  return { capturedAt: now.toISOString(), user, history, codeStats: await fetchCodeStats(login, token, repos) }
}

// One contributions window per year, oldest first; the current year's window ends at `now`.
export async function fetchHistory(login, token, years, now = new Date()) {
  const ordered = [...years].sort((a, b) => a - b)
  const windows = ordered.map((year) => {
    const to = new Date(Math.min(Date.UTC(year, 11, 31, 23, 59, 59), now.getTime())).toISOString()
    return `y${year}: contributionsCollection(from: "${year}-01-01T00:00:00Z", to: "${to}") {${YEAR_FIELDS}}`
  })
  const user = await graphqlUser(`query($login: String!) { user(login: $login) { ${windows.join("\n")} } }`, login, token)
  return ordered.map((year) => ({ year, ...user[`y${year}`] }))
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

export function calendarDays(collection) {
  return collection.contributionCalendar.weeks.flatMap((week) => week.contributionDays).map((day) => ({ date: day.date, count: day.contributionCount }))
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
      const entry = totals.get(edge.node.name) ?? { name: edge.node.name, size: 0 }
      entry.size += edge.size
      totals.set(edge.node.name, entry)
    }
  }
  const ranked = [...totals.values()].sort((a, b) => b.size - a.size)
  const sum = ranked.reduce((acc, entry) => acc + entry.size, 0) || 1
  return ranked.slice(0, limit).map((entry) => ({ name: entry.name, share: Math.round((entry.size / sum) * 1000) / 10 }))
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
  // The contributor endpoint returns every week since each repository was created, so the same
  // pass totals the whole history and the trailing year.
  const allTime = { added: 0, deleted: 0, commits: 0 }
  for (const [name, weeks] of Object.entries(codeStats)) {
    const repo = { name, added: 0, deleted: 0, commits: 0, color: colors.get(name) ?? "#8b949e" }
    for (const week of weeks) {
      allTime.added += week.a
      allTime.deleted += week.d
      allTime.commits += week.c
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
  return { added: sum("added"), deleted: sum("deleted"), commits: sum("commits"), allTime, byRepo: byRepo.slice(0, 6), weeks }
}

// Commits per language over every year: each repository counts toward its primary language.
export function languagesByCommits(history) {
  const totals = new Map()
  for (const year of history) {
    for (const entry of year.commitContributionsByRepository ?? []) {
      const language = entry.repository.primaryLanguage
      if (!language || entry.contributions.totalCount === 0) continue
      const slot = totals.get(language.name) ?? { name: language.name, commits: 0 }
      slot.commits += entry.contributions.totalCount
      totals.set(language.name, slot)
    }
  }
  return [...totals.values()].sort((a, b) => b.commits - a.commits || a.name.localeCompare(b.name))
}

const DAY_MS = 86400000

// One row per calendar year and one column per Sunday-to-Saturday week, as on GitHub's calendar.
// Days before the account existed or after today get no cell, and a year's rare 54th week folds
// into the 53rd so every row has the same length.
export function weeklyGrid(days, since, today) {
  const counts = new Map(days.map((day) => [day.date, day.count]))
  const rows = []
  for (let year = Number(since.slice(0, 4)); year <= Number(today.slice(0, 4)); year += 1) {
    const start = Date.UTC(year, 0, 1)
    const offset = new Date(start).getUTCDay()
    const weeks = new Map()
    for (let time = start; new Date(time).getUTCFullYear() === year; time += DAY_MS) {
      const date = new Date(time).toISOString().slice(0, 10)
      if (date < since || date > today) continue
      const column = Math.min(52, Math.floor(((time - start) / DAY_MS + offset) / 7))
      weeks.set(column, (weeks.get(column) ?? 0) + (counts.get(date) ?? 0))
    }
    rows.push({ year, weeks: [...weeks].map(([column, count]) => ({ column, count })) })
  }
  return rows
}

// Totals, days, and languages since the account was created, summed over the yearly windows.
// A date seen in two windows keeps its larger count, so a padded calendar edge cannot erase a day.
export function allTimeSummary(history, since, today) {
  const sum = (pick) => history.reduce((acc, year) => acc + pick(year), 0)
  const byDate = new Map()
  for (const day of history.flatMap((year) => calendarDays(year))) byDate.set(day.date, Math.max(byDate.get(day.date) ?? 0, day.count))
  const days = [...byDate].map(([date, count]) => ({ date, count })).filter((day) => day.date >= since && day.date <= today)
  return {
    totals: {
      contributions: sum((year) => year.contributionCalendar.totalContributions),
      commits: sum((year) => year.totalCommitContributions),
      issues: sum((year) => year.totalIssueContributions),
      pullRequests: sum((year) => year.totalPullRequestContributions),
      reviews: sum((year) => year.totalPullRequestReviewContributions),
      repositories: sum((year) => year.totalRepositoryContributions)
    },
    days,
    languages: languagesByCommits(history),
    grid: weeklyGrid(days, since, today)
  }
}

// Every contribution number on the cards counts from the day the account was created.
export function summarize({ user, history, codeStats }, now = new Date()) {
  const today = now.toISOString().slice(0, 10)
  const since = user.createdAt.slice(0, 10)
  const allTime = allTimeSummary(history, since, today)
  const nodes = user.repositories.nodes
  return {
    name: user.name ?? user.login,
    login: user.login,
    updated: today,
    since,
    followers: user.followers.totalCount,
    repos: user.repositories.totalCount,
    stars: nodes.reduce((acc, repo) => acc + repo.stargazerCount, 0),
    forks: nodes.reduce((acc, repo) => acc + repo.forkCount, 0),
    commits: allTime.totals.commits,
    pullRequests: allTime.totals.pullRequests,
    issues: allTime.totals.issues,
    reviews: allTime.totals.reviews,
    repositoriesCreated: allTime.totals.repositories,
    total: allTime.totals.contributions,
    streak: computeStreaks(allTime.days, today),
    languages: topLanguages(nodes),
    commitLanguages: allTime.languages,
    grid: allTime.grid,
    repositoriesByCommits: commitsByRepository(user.contributionsCollection),
    code: codeSummary(codeStats, nodes, now)
  }
}
