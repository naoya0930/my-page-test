#!/usr/bin/env node

/**
 * Test Supabase Authentication and API Access
 * This script tests logging in with the sample user and calling the API
 */

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://gdihhinaswtkdzmgqxsa.supabase.co'
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_4T-JL8Yx-rl3_8kVYxTYhQ_PifLpQ2x'
const SAMPLE_USER_EMAIL = process.env.SAMPLE_USER_NAME || 'user@example.com'
const SAMPLE_USER_PASSWORD = process.env.SAMPLE_USER_PASSWORD || 'super'
const API_BASE_URL = process.env.API_BASE_URL || 'http://workers:8787'

async function testAuth() {
  console.log('🔐 Testing Supabase Authentication...\n')
  console.log(`Email: ${SAMPLE_USER_EMAIL}`)
  console.log(`Supabase URL: ${SUPABASE_URL}\n`)

  try {
    // Step 1: Sign in with Supabase
    console.log('📝 Step 1: Signing in with Supabase...')
    const authResponse = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_ANON_KEY
      },
      body: JSON.stringify({
        email: SAMPLE_USER_EMAIL,
        password: SAMPLE_USER_PASSWORD
      })
    })

    if (!authResponse.ok) {
      const errorText = await authResponse.text()
      console.error(`❌ Authentication failed: ${authResponse.status}`)
      console.error(`Response: ${errorText}`)
      return
    }

    const authData = await authResponse.json()
    const accessToken = authData.access_token
    const user = authData.user

    console.log(`✅ Authentication successful!`)
    console.log(`   User ID: ${user.id}`)
    console.log(`   Email: ${user.email}`)
    console.log(`   Token: ${accessToken.substring(0, 20)}...\n`)

    // Step 2: Test API base route
    console.log('📝 Step 2: Testing API base route...')
    const apiResponse = await fetch(`${API_BASE_URL}/api/`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    })

    if (!apiResponse.ok) {
      const errorText = await apiResponse.text()
      console.error(`❌ API call failed: ${apiResponse.status}`)
      console.error(`Response: ${errorText}`)
      return
    }

    const apiData = await apiResponse.json()
    console.log(`✅ API call successful!`)
    console.log(`   Response:`, JSON.stringify(apiData, null, 2), '\n')

    // Step 3: Test GET /api/progress
    console.log('📝 Step 3: Testing GET /api/progress...')
    const progressResponse = await fetch(`${API_BASE_URL}/api/progress`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    })

    if (!progressResponse.ok) {
      const errorText = await progressResponse.text()
      console.error(`❌ Progress API call failed: ${progressResponse.status}`)
      console.error(`Response: ${errorText}`)
      return
    }

    const progressData = await progressResponse.json()
    console.log(`✅ Progress API call successful!`)
    console.log(`   Response:`, JSON.stringify(progressData, null, 2), '\n')

    // Step 4: Test POST /api/morning-pages
    console.log('📝 Step 4: Testing POST /api/morning-pages...')
    const createResponse = await fetch(`${API_BASE_URL}/api/morning-pages`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        content: 'テスト用のモーニングページ。今日は良い天気です。'
      })
    })

    if (!createResponse.ok) {
      const errorText = await createResponse.text()
      console.error(`❌ Create morning page failed: ${createResponse.status}`)
      console.error(`Response: ${errorText}`)
      return
    }

    const createData = await createResponse.json()
    console.log(`✅ Create morning page successful!`)
    console.log(`   Response:`, JSON.stringify(createData, null, 2), '\n')

    // Step 5: Test GET /api/morning-pages (verify content field)
    console.log('📝 Step 5: Testing GET /api/morning-pages (verify content field)...')
    const today = new Date().toISOString().split('T')[0]
    const getResponse = await fetch(`${API_BASE_URL}/api/morning-pages?date=${today}`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    })

    if (!getResponse.ok) {
      const errorText = await getResponse.text()
      console.error(`❌ Get morning page failed: ${getResponse.status}`)
      console.error(`Response: ${errorText}`)
      return
    }

    const getData = await getResponse.json()
    console.log(`✅ Get morning page successful!`)
    console.log(`   Response:`, JSON.stringify(getData, null, 2))
    
    if (getData.data && getData.data.content) {
      console.log(`   ✅ Content field is present: "${getData.data.content}"\n`)
    } else {
      console.log(`   ⚠️  Content field is missing or empty!\n`)
    }

    console.log('🎉 All tests completed successfully!')

  } catch (error) {
    console.error('❌ Test failed with error:', error.message)
    console.error(error.stack)
  }
}

testAuth()
