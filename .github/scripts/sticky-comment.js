/*
 * Keep a single preview comment on a pull request, rather than adding one per push.
 *
 * The comment is found by the HTML marker that opens `body`, so the marker has to
 * stay stable across the messages that use it. Called from
 * .github/workflows/preview.yml via actions/github-script.
 *
 *   onlyIfPresent  do not create the comment if there is not already one to update,
 *                  so closing a pull request that never had a preview stays quiet.
 */
module.exports = async ({ github, context, body, onlyIfPresent = false }) => {
  const marker = body.match(/^<!--[^>]*-->/)
  if (!marker) throw new Error("body must start with an HTML comment marker")

  const issue_number = context.payload.number ?? context.issue.number
  const { owner, repo } = context.repo

  const comments = await github.paginate(github.rest.issues.listComments, {
    owner,
    repo,
    issue_number,
    per_page: 100,
  })
  const existing = comments.find(
    (c) => c.user?.type === "Bot" && c.body?.startsWith(marker[0])
  )

  if (existing) {
    await github.rest.issues.updateComment({
      owner,
      repo,
      comment_id: existing.id,
      body,
    })
    return existing.id
  }

  if (onlyIfPresent) return null

  const created = await github.rest.issues.createComment({
    owner,
    repo,
    issue_number,
    body,
  })
  return created.data.id
}
