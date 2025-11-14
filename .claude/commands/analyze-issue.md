---
description: Analyze a GitHub issue and create a resolution plan
argument-hint: <issue-number-or-url>
---

Deep-dive on the GitHub issue provided in $ARGUMENTS. Find the problem and generate a plan. Do not write code. Explain the problem clearly and propose a comprehensive plan to solve it.

PROMPT for the issue number or URL if not provided, and stop here.

Steps:

1. Fetch issue data using: `gh issue view $ARGUMENTS --json author,title,number,body,comments,labels`
2. Parse the JSON response to extract:
   - Title and number
   - Description (body)
   - All comments with authors
   - Labels
3. Format the issue context clearly
4. Review the issue context and details
5. Examine the relevant parts of the codebase. Analyze the code thoroughly until you have a solid understanding of how it works.
6. Explain the issue in detail, including the problem and its root cause. There is no guarantee the issue is valid, so be critical and thorough in your analysis.
7. Create a comprehensive plan to solve the issue. The plan should include:
   - Required code changes
   - Potential impacts on other parts of the system
   - Necessary tests to be written or updated
   - Documentation updates
   - Performance considerations
   - Security implications
   - Backwards compatibility (if applicable)
   - Include the reference link to the source issue and any related discussions
8. Think deeply about all aspects of the task. Consider edge cases, potential challenges, and best practices for addressing the issue.

**IMPORTANT: ONLY CREATE A PLAN. DO NOT WRITE ANY CODE.** Your task is to create a thorough, comprehensive strategy for understanding and resolving the issue.
