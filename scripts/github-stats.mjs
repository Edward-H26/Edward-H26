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
      totalCommitContributions
      totalPullRequestContributions
      totalIssueContributions
      totalPullRequestReviewContributions
      contributionCalendar { totalContributions weeks { contributionDays { date contributionCount } } }
    }
  }
}`

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
  const events = await request(`https://api.github.com/users/${login}/events/public?per_page=40`, token)
  return { capturedAt: new Date().toISOString(), user: graphql.data.user, events: events.map(slimEvent) }
}

// Only the fields the activity card needs are kept, so fixtures never store commit
// messages or author emails.
export function slimEvent(event) {
  const payload = event.payload ?? {}
  return {
    type: event.type,
    repo: { name: event.repo?.name },
    created_at: event.created_at,
    payload: {
      ...(payload.size !== undefined ? { size: payload.size } : {}),
      ...(payload.action ? { action: payload.action } : {}),
      ...(payload.ref_type ? { ref_type: payload.ref_type, ref: payload.ref ?? null } : {}),
      ...(payload.pull_request ? { pull_request: { merged: Boolean(payload.pull_request.merged) } } : {})
    }
  }
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
      const color = /^#[0-9a-f]{6}$/i.test(edge.node.color ?? "") ? edge.node.color : "#8b949e"
      const entry = totals.get(edge.node.name) ?? { name: edge.node.name, color, size: 0 }
      entry.size += edge.size
      totals.set(edge.node.name, entry)
    }
  }
  const ranked = [...totals.values()].sort((a, b) => b.size - a.size)
  const sum = ranked.reduce((acc, entry) => acc + entry.size, 0) || 1
  return ranked.slice(0, limit).map((entry) => ({ name: entry.name, color: entry.color, share: Math.round((entry.size / sum) * 1000) / 10 }))
}

export function relativeTime(iso, now) {
  const minutes = Math.max(1, Math.round((now.getTime() - new Date(iso).getTime()) / 60000))
  if (minutes < 60) return `${minutes} min ago`
  const hours = Math.round(minutes / 60)
  if (hours < 24) return `${hours} h ago`
  const days = Math.round(hours / 24)
  if (days < 30) return `${days} d ago`
  const months = Math.round(days / 30)
  return months < 12 ? `${months} mo ago` : `${Math.round(months / 12)} y ago`
}

const EVENT_TEXT = {
  PushEvent: () => "Pushed to",
  PullRequestEvent: (event) => `${event.payload.pull_request?.merged ? "Merged" : event.payload.action === "opened" ? "Opened" : "Updated"} a pull request in`,
  IssuesEvent: (event) => `${event.payload.action === "opened" ? "Opened" : "Updated"} an issue in`,
  IssueCommentEvent: () => "Commented on an issue in",
  CreateEvent: (event) => (event.payload.ref_type === "repository" ? "Created the repository" : `Created ${event.payload.ref_type} ${event.payload.ref ?? ""} in`),
  WatchEvent: () => "Starred",
  ForkEvent: () => "Forked",
  ReleaseEvent: () => "Published a release in",
  PublicEvent: () => "Open sourced"
}

export function summarizeEvents(events, now, limit = 5) {
  const items = []
  for (const event of events) {
    const describe = EVENT_TEXT[event.type]
    if (!describe || !event.repo?.name) continue
    items.push({ type: event.type, text: describe(event).trim(), repo: event.repo.name, when: relativeTime(event.created_at, now) })
    if (items.length === limit) break
  }
  return items
}

export function summarize({ user, events }, now = new Date()) {
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
    weeks: contributions.contributionCalendar.weeks.slice(-26).map((week) => week.contributionDays.map((day) => day.contributionCount)),
    languages: topLanguages(nodes),
    activity: summarizeEvents(events, now)
  }
}
