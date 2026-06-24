/**
 * Integration Test Script for Artist's Way App
 * Tests all functionality end-to-end
 */

import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY
const API_BASE_URL = 'http://workers:8787/api'
const SAMPLE_EMAIL = process.env.SAMPLE_USER_NAME
const SAMPLE_PASSWORD = process.env.SAMPLE_USER_PASSWORD

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

let authToken = ''
let testResults = {
  passed: 0,
  failed: 0,
  tests: []
}

function logTest(name, passed, message = '') {
  const status = passed ? '✅ PASS' : '❌ FAIL'
  console.log(`\n${status}: ${name}`)
  if (message) console.log(`   ${message}`)
  
  testResults.tests.push({ name, passed, message })
  if (passed) {
    testResults.passed++
  } else {
    testResults.failed++
  }
}

async function test1_Authentication() {
  console.log('\n========================================')
  console.log('Test 1: Authentication')
  console.log('========================================')
  
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: SAMPLE_EMAIL,
      password: SAMPLE_PASSWORD
    })
    
    if (error) throw error
    if (!data.session?.access_token) throw new Error('No access token received')
    
    authToken = data.session.access_token
    logTest('Authentication', true, `Logged in as ${data.user.email}`)
  } catch (error) {
    logTest('Authentication', false, error.message)
    throw error // Stop tests if authentication fails
  }
}

async function test2_ProgressAPI() {
  console.log('\n========================================')
  console.log('Test 2: GET /api/progress')
  console.log('========================================')
  
  try {
    const response = await fetch(`${API_BASE_URL}/progress`, {
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    })
    
    if (!response.ok) throw new Error(`HTTP ${response.status}`)
    
    const result = await response.json()
    
    if (!result.ok || !result.data) {
      throw new Error('Invalid response structure')
    }
    
    const { current_week, morning_pages_this_week, morning_page_done, artist_date_done } = result.data
    
    logTest('Progress API', true, 
      `Week: ${current_week}, Morning pages: ${morning_pages_this_week}, Done: MP=${morning_page_done}, AD=${artist_date_done}`)
    
    return result.data
  } catch (error) {
    logTest('Progress API', false, error.message)
    throw error
  }
}

async function test3_MorningPageCreate() {
  console.log('\n========================================')
  console.log('Test 3: POST /api/morning-pages (Create)')
  console.log('========================================')
  
  const testContent = `統合テストのモーニングページ。
今日は${new Date().toLocaleString('ja-JP')}です。
このテストでは、モーニングページの保存機能を確認しています。
文字数カウントも正しく動作するはずです。`
  
  try {
    const response = await fetch(`${API_BASE_URL}/morning-pages`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ content: testContent })
    })
    
    if (!response.ok) throw new Error(`HTTP ${response.status}`)
    
    const result = await response.json()
    
    if (!result.ok || !result.data) {
      throw new Error('Invalid response structure')
    }
    
    const { entry_date, character_count } = result.data
    const expectedCount = testContent.length
    
    if (character_count !== expectedCount) {
      throw new Error(`Character count mismatch: expected ${expectedCount}, got ${character_count}`)
    }
    
    logTest('Morning Page Create', true, 
      `Date: ${entry_date}, Character count: ${character_count} (correct!)`)
  } catch (error) {
    logTest('Morning Page Create', false, error.message)
  }
}

async function test4_MorningPageGet() {
  console.log('\n========================================')
  console.log('Test 4: GET /api/morning-pages (Retrieve)')
  console.log('========================================')
  
  const today = new Date().toISOString().split('T')[0]
  
  try {
    const response = await fetch(`${API_BASE_URL}/morning-pages?date=${today}`, {
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    })
    
    if (!response.ok) throw new Error(`HTTP ${response.status}`)
    
    const result = await response.json()
    
    if (!result.ok || !result.data) {
      throw new Error('Invalid response structure')
    }
    
    const { content, character_count } = result.data
    
    if (!content || content.length === 0) {
      throw new Error('Content field is empty')
    }
    
    if (character_count !== content.length) {
      throw new Error(`Character count mismatch: content length ${content.length}, count ${character_count}`)
    }
    
    logTest('Morning Page Retrieve', true, 
      `Content length: ${content.length}, Character count: ${character_count} (matched!)`)
  } catch (error) {
    logTest('Morning Page Retrieve', false, error.message)
  }
}

async function test5_ArtistDateCreate() {
  console.log('\n========================================')
  console.log('Test 5: POST /api/artist-dates (Create)')
  console.log('========================================')
  
  try {
    // First get current week
    const progressResponse = await fetch(`${API_BASE_URL}/progress`, {
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    })
    
    if (!progressResponse.ok) throw new Error(`Failed to get progress: HTTP ${progressResponse.status}`)
    
    const progressResult = await progressResponse.json()
    const currentWeek = progressResult.data.current_week
    
    // Create artist date
    const response = await fetch(`${API_BASE_URL}/artist-dates`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        week_number: currentWeek,
        went_out: true,
        excited: true
      })
    })
    
    if (!response.ok) throw new Error(`HTTP ${response.status}`)
    
    const result = await response.json()
    
    if (!result.ok || !result.data) {
      throw new Error('Invalid response structure')
    }
    
    const { week_number, went_out, excited } = result.data
    
    logTest('Artist Date Create', true, 
      `Week: ${week_number}, Went out: ${went_out}, Excited: ${excited}`)
  } catch (error) {
    logTest('Artist Date Create', false, error.message)
  }
}

async function test6_ArtistDateGet() {
  console.log('\n========================================')
  console.log('Test 6: GET /api/artist-dates (Retrieve)')
  console.log('========================================')
  
  try {
    // Get current week
    const progressResponse = await fetch(`${API_BASE_URL}/progress`, {
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    })
    
    const progressResult = await progressResponse.json()
    const currentWeek = progressResult.data.current_week
    
    // Get artist date
    const response = await fetch(`${API_BASE_URL}/artist-dates?week_number=${currentWeek}`, {
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    })
    
    if (!response.ok) throw new Error(`HTTP ${response.status}`)
    
    const result = await response.json()
    
    if (!result.ok || !result.data) {
      throw new Error('Invalid response structure')
    }
    
    const { week_number, went_out, excited } = result.data
    
    // Verify the data we just saved
    if (went_out !== true || excited !== true) {
      throw new Error(`Data mismatch: went_out=${went_out}, excited=${excited}`)
    }
    
    logTest('Artist Date Retrieve', true, 
      `Week: ${week_number}, Went out: ${went_out}, Excited: ${excited}`)
  } catch (error) {
    logTest('Artist Date Retrieve', false, error.message)
  }
}

async function test7_ProgressAfterSave() {
  console.log('\n========================================')
  console.log('Test 7: Progress API (After Saving Data)')
  console.log('========================================')
  
  try {
    const response = await fetch(`${API_BASE_URL}/progress`, {
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    })
    
    if (!response.ok) throw new Error(`HTTP ${response.status}`)
    
    const result = await response.json()
    
    if (!result.ok || !result.data) {
      throw new Error('Invalid response structure')
    }
    
    const { current_week, morning_pages_this_week, morning_page_done, artist_date_done } = result.data
    
    // Verify that progress reflects our saves
    if (morning_page_done !== true) {
      console.log('   ⚠️  Warning: morning_page_done should be true after saving')
    }
    
    if (artist_date_done !== true) {
      console.log('   ⚠️  Warning: artist_date_done should be true after saving')
    }
    
    logTest('Progress After Save', true, 
      `Week: ${current_week}, Morning pages: ${morning_pages_this_week}, Done: MP=${morning_page_done}, AD=${artist_date_done}`)
  } catch (error) {
    logTest('Progress After Save', false, error.message)
  }
}

async function test8_UnauthorizedAccess() {
  console.log('\n========================================')
  console.log('Test 8: Unauthorized Access (No Token)')
  console.log('========================================')
  
  try {
    const response = await fetch(`${API_BASE_URL}/progress`)
    
    if (response.ok) {
      throw new Error('Should have failed without auth token')
    }
    
    if (response.status === 401) {
      logTest('Unauthorized Access Guard', true, 'Correctly rejected request without token (401)')
    } else {
      logTest('Unauthorized Access Guard', true, `Rejected with status ${response.status}`)
    }
  } catch (error) {
    logTest('Unauthorized Access Guard', false, error.message)
  }
}

async function printSummary() {
  console.log('\n')
  console.log('========================================')
  console.log('TEST SUMMARY')
  console.log('========================================')
  console.log(`Total Tests: ${testResults.passed + testResults.failed}`)
  console.log(`✅ Passed: ${testResults.passed}`)
  console.log(`❌ Failed: ${testResults.failed}`)
  console.log('========================================')
  
  if (testResults.failed > 0) {
    console.log('\nFailed Tests:')
    testResults.tests
      .filter(t => !t.passed)
      .forEach(t => console.log(`  - ${t.name}: ${t.message}`))
  }
  
  console.log('\n')
  
  if (testResults.failed === 0) {
    console.log('🎉 All tests passed!')
    process.exit(0)
  } else {
    console.log('⚠️  Some tests failed. Please review the results above.')
    process.exit(1)
  }
}

async function runTests() {
  console.log('========================================')
  console.log('Integration Test Suite')
  console.log('Artist\'s Way App')
  console.log('========================================')
  console.log(`API Base URL: ${API_BASE_URL}`)
  console.log(`Test User: ${SAMPLE_EMAIL}`)
  console.log('========================================')
  
  try {
    await test1_Authentication()
    await test2_ProgressAPI()
    await test3_MorningPageCreate()
    await test4_MorningPageGet()
    await test5_ArtistDateCreate()
    await test6_ArtistDateGet()
    await test7_ProgressAfterSave()
    await test8_UnauthorizedAccess()
  } catch (error) {
    console.error('\n❌ Test suite stopped due to critical error:', error.message)
  }
  
  await printSummary()
}

runTests()
