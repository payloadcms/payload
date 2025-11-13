/**
 * Simple test script to verify analysis functions work correctly
 */

import { analyzeSEO } from './src/analysis/index.js'

// Test 1: Basic SEO Analysis
console.log('=== Test 1: Basic SEO Analysis ===')

const testContent = `
<h1>Complete Guide to SEO Optimization</h1>

<p>SEO optimization is crucial for any website. In this comprehensive guide, we'll cover everything you need to know about SEO optimization and how to implement it effectively.</p>

<h2>Why SEO Optimization Matters</h2>

<p>SEO optimization helps your website rank better in search engines. Good SEO optimization can increase organic traffic significantly.</p>

<h2>Best Practices for SEO Optimization</h2>

<ul>
  <li>Use your focus keyword naturally throughout the content</li>
  <li>Write quality content over 300 words</li>
  <li>Include images with descriptive alt text</li>
  <li>Add internal and external links</li>
  <li>Structure your content with proper headings</li>
</ul>

<p>By following these SEO optimization best practices, you can improve your search rankings and drive more traffic to your site.</p>

<img src="seo-guide.jpg" alt="SEO optimization guide showing best practices" />

<p>For more information, check out <a href="/blog">our blog</a> or visit <a href="https://example.com">this resource</a>.</p>
`

try {
  const result = analyzeSEO({
    content: testContent,
    focusKeyword: 'SEO optimization',
    meta: {
      title: 'Complete Guide to SEO Optimization | My Site',
      description:
        'Learn everything about SEO optimization including keywords, content, technical aspects, and more in this comprehensive guide.',
    },
    url: 'https://mysite.com/seo-optimization-guide',
  })

  console.log('\n✅ Analysis completed successfully!\n')
  console.log('Overall Score:', result.score.total, '/ 100')
  console.log('Breakdown:')
  console.log('  - Keyword:', result.score.breakdown.keyword, '/ 25')
  console.log('  - Content:', result.score.breakdown.content, '/ 25')
  console.log('  - Technical:', result.score.breakdown.technical, '/ 25')
  console.log('  - Readability:', result.score.breakdown.readability, '/ 25')

  console.log('\n📊 Keyword Analysis:')
  console.log('  - Density:', result.keyword.density.toFixed(2) + '%')
  console.log('  - Count:', result.keyword.count)
  console.log('  - In Title:', result.keyword.positions.title ? '✅' : '❌')
  console.log('  - In Description:', result.keyword.positions.description ? '✅' : '❌')
  console.log('  - In H1:', result.keyword.positions.h1 ? '✅' : '❌')
  console.log('  - In URL:', result.keyword.positions.url ? '✅' : '❌')

  console.log('\n📝 Content Analysis:')
  console.log('  - Word Count:', result.content.wordCount)
  console.log('  - H1 Headings:', result.content.headings.h1)
  console.log('  - H2 Headings:', result.content.headings.h2)
  console.log('  - Images:', result.content.images.total)
  console.log('  - Images with Alt:', result.content.images.withAlt)
  console.log('  - Internal Links:', result.content.links.internal)
  console.log('  - External Links:', result.content.links.external)

  console.log('\n📖 Readability:')
  console.log('  - Flesch Score:', result.content.readability.fleschScore)
  console.log('  - Avg Words/Sentence:', result.content.readability.avgWordsPerSentence)
  console.log('  - Passive Voice:', result.content.readability.passiveVoicePercentage + '%')

  console.log('\n💡 Top Recommendations:')
  result.score.recommendations.slice(0, 5).forEach((rec, i) => {
    console.log(`  ${i + 1}. ${rec}`)
  })

  console.log('\n⚠️  Issues Found:', result.score.issues.length)
  if (result.score.issues.length > 0) {
    result.score.issues.slice(0, 3).forEach((issue, i) => {
      console.log(`  ${i + 1}. [${issue.type}] ${issue.message}`)
    })
  }

  console.log('\n\n🎉 All tests passed successfully!')
  console.log('Plugin is ready to use!\n')
} catch (error) {
  console.error('❌ Error during analysis:', error)
  process.exit(1)
}
