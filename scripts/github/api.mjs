// @ts-check
// The GitHub API layer: the GraphQL queries and REST calls behind the live cards. Everything else
// works on the plain JSON this module returns, so it can run from a recorded fixture instead.

const GRAPHQL_URL = "https://api.github.com/graphql"
const REST_URL = "https://api.github.com"
const USER_AGENT = "profile-assets"
// GitHub computes contributor statistics lazily and answers 202 until they are ready.
const STATS_ATTEMPTS = 8
const STATS_RETRY_MS = 3000

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

/** @param {string} token */
const headers = (token) => ({ Authorization: `bearer ${token}`, "User-Agent": USER_AGENT, Accept: "application/vnd.github+json" })

/**
 * @param {string} url
 * @param {string} token
 * @param {RequestInit} [init]
 * @returns {Promise<any>}
 */
async function request(url, token, init = {}) {
  const response = await fetch(url, { ...init, headers: headers(token) })
  if (!response.ok) throw new Error(`${url} answered ${response.status}: ${(await response.text()).slice(0, 200)}`)
  return response.json()
}

/**
 * @param {string} query
 * @param {string} login
 * @param {string} token
 * @returns {Promise<any>} the `user` object of the response
 */
async function graphqlUser(query, login, token) {
  const graphql = await request(GRAPHQL_URL, token, { method: "POST", body: JSON.stringify({ query, variables: { login } }) })
  if (graphql.errors) throw new Error(`GraphQL: ${JSON.stringify(graphql.errors).slice(0, 300)}`)
  return graphql.data.user
}

/**
 * One contributions window per year, oldest first; the current year's window ends at `now`.
 * @param {string} login
 * @param {string} token
 * @param {number[]} years
 * @param {Date} now
 */
async function fetchHistory(login, token, years, now) {
  const ordered = [...years].sort((a, b) => a - b)
  const windows = ordered.map((year) => {
    const to = new Date(Math.min(Date.UTC(year, 11, 31, 23, 59, 59), now.getTime())).toISOString()
    return `y${year}: contributionsCollection(from: "${year}-01-01T00:00:00Z", to: "${to}") {${YEAR_FIELDS}}`
  })
  const user = await graphqlUser(`query($login: String!) { user(login: $login) { ${windows.join("\n")} } }`, login, token)
  return ordered.map((year) => ({ year, ...user[`y${year}`] }))
}

/**
 * @param {string} url
 * @param {string} token
 * @returns {Promise<any[]>} the contributor statistics, or nothing when GitHub has none or never finished them
 */
async function requestStats(url, token) {
  for (let attempt = 0; attempt < STATS_ATTEMPTS; attempt += 1) {
    const response = await fetch(url, { headers: headers(token) })
    if (response.status === 202) {
      await new Promise((resolve) => setTimeout(resolve, STATS_RETRY_MS))
      continue
    }
    if (response.status === 204) return []
    if (!response.ok) throw new Error(`${url} answered ${response.status}`)
    return response.json()
  }
  return []
}

/**
 * The user's own weekly lines added, deleted, and commits per repository; only weeks with
 * activity are kept, so fixtures stay small.
 * @param {string} login
 * @param {string} token
 * @param {string[]} repos
 * @returns {Promise<Record<string, { w: number, a: number, d: number, c: number }[]>>}
 */
async function fetchCodeStats(login, token, repos) {
  /** @type {Record<string, { w: number, a: number, d: number, c: number }[]>} */
  const stats = {}
  for (const repo of repos) {
    const contributors = await requestStats(`${REST_URL}/repos/${login}/${repo}/stats/contributors`, token)
    const own = (Array.isArray(contributors) ? contributors : []).find((entry) => entry.author?.login === login)
    if (own) stats[repo] = own.weeks.filter((week) => week.a || week.d || week.c).map((week) => ({ w: week.w, a: week.a, d: week.d, c: week.c }))
  }
  return stats
}

/**
 * Everything the live cards need, as the fixture records it: the profile query, one contributions
 * window per year, and the weekly code statistics of every non-fork repository.
 * @param {string} login
 * @param {string} token a GitHub token with public read access
 */
export async function fetchGithub(login, token) {
  const now = new Date()
  const user = await graphqlUser(STATS_QUERY, login, token)
  const repos = user.repositories.nodes.filter((repo) => !repo.isFork).map((repo) => repo.name)
  const history = await fetchHistory(login, token, user.contributionsCollection.contributionYears, now)
  return { capturedAt: now.toISOString(), user, history, codeStats: await fetchCodeStats(login, token, repos) }
}
