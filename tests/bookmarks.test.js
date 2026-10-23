import assert from 'node:assert/strict'
import test from 'node:test'
import { testing } from '../plugin.js'

const html = `<!DOCTYPE NETSCAPE-Bookmark-file-1>
<TITLE>Bookmarks</TITLE><DL><p>
<DT><H3 PERSONAL_TOOLBAR_FOLDER="true">书签栏</H3><DL><p>
<DT><H3>Research</H3><DL><p>
<DT><A HREF="https://example.org/paper" ADD_DATE="1700000000">Paper &amp; notes</A>
<DT><H3>Methods</H3><DL><p>
<DT><A HREF="https://example.org/method">Method</A>
</DL><p>
<DT><A HREF="javascript:alert(1)">Bookmarklet</A>
<DT><A HREF="file:///private/notes.txt">Local file</A>
<DT><A HREF="chrome://settings">Settings</A>
</DL><p>
<DT><H3>Music</H3><DL><p>
<DT><A HREF="https://example.org/music">Music</A>
</DL><p>
</DL><p></DL>`

test('browser import splits categories, preserves nested tags, and filters unsafe links', () => {
  const parsed = testing.parseBookmarkHtml(html, { fileName: 'chrome-bookmarks.html' })
  assert.deepEqual(parsed.groups.map(group => group.name), ['Research', 'Music'])
  assert.equal(parsed.validCount, 3)
  assert.equal(parsed.skippedCount, 3)
  assert.equal(parsed.groups[0].items[0].title, 'Paper & notes')
  assert.ok(parsed.groups[0].items[1].tags.some(tag => tag.includes('Methods')))
  assert.equal(parsed.source.key, 'chrome')
  assert.ok(parsed.groups.flatMap(group => group.items).every(item => item.url.startsWith('https://')))
})

test('reimporting a bookmark category replaces its folder and retains source provenance', () => {
  const state = testing.createEmptyState()
  const parsed = testing.parseBookmarkHtml(html, { fileName: 'chrome-bookmarks.html' })
  const first = testing.applyBookmarkGroupsImport(state, parsed.groups, parsed.source, 'chrome-bookmarks.html')
  assert.equal(first.added, 2)
  const ids = state.collections.map(folder => folder.id)
  const second = testing.applyBookmarkGroupsImport(state, parsed.groups, parsed.source, 'chrome-bookmarks-new.html')
  assert.equal(second.replaced, 2)
  assert.deepEqual(state.collections.map(folder => folder.id), ids)
  assert.ok(state.collections.every(folder => folder.upper.includes('chrome-bookmarks-new.html')))
})

test('sparse bookmarks may yield no knowledge or preferences; malformed HTML is rejected', () => {
  assert.deepEqual(testing.normalizeFolderAnalysisOutput({ records: [], preferences: [] }, { allowEmpty: true }), { records: [], preferences: [] })
  assert.throws(() => testing.parseBookmarkHtml('<p>not a bookmark export</p>'), /HTML/)
})
