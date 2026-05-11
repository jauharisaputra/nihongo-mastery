// ========================================
// NIHONGO MASTERY - GOOGLE APPS SCRIPT API
// FIXED CORS VERSION 2026
// ========================================

// ========================================
// CONFIG
// ========================================
const SHEET_ID = '1fOH-0m6afdeZwjFfORs1spjhr2EYD8rtlwRK843wZDw';

// ========================================
// MAIN HANDLERS
// ========================================
function doGet(e) {
  return handleRequest(e);
}

function doPost(e) {
  return handleRequest(e);
}

// ========================================
// CORS PREFLIGHT
// ========================================
function doOptions(e) {
  return ContentService
    .createTextOutput('')
    .setMimeType(ContentService.MimeType.TEXT);
}

// ========================================
// MAIN REQUEST HANDLER
// ========================================
function handleRequest(e) {
  try {

    // ========================================
    // PARSE REQUEST DATA
    // ========================================
    let data = {};

    // GET request
    if (e.parameter && e.parameter.action) {
      data = e.parameter;
    }

    // POST JSON request
    else if (e.postData && e.postData.contents) {
      try {
        data = JSON.parse(e.postData.contents);
      } catch (jsonError) {
        data = e.parameter || {};
      }
    }

    const action = data.action || '';

    // ========================================
    // DEBUG LOG
    // ========================================
    console.log('ACTION:', action);
    console.log('DATA:', JSON.stringify(data));

    // ========================================
    // OPEN SHEET
    // ========================================
    const ss = SpreadsheetApp.openById(SHEET_ID);

    // ========================================
    // ROUTING
    // ========================================
    switch (action) {

      case 'register':
        return registerUser(ss, data);

      case 'save_result':
        return saveResult(ss, data);

      case 'check_user':
        return checkUser(ss, data.email);

      case 'verify_payment':
        return verifyPayment(ss, data);

      case 'ping':
        return jsonResponse({
          success: true,
          message: 'API ONLINE',
          time: new Date()
        });

      default:
        return jsonResponse({
          success: false,
          error: 'Invalid action'
        });
    }

  } catch (error) {

    console.error(error);

    return jsonResponse({
      success: false,
      error: error.toString()
    });
  }
}

// ========================================
// REGISTER USER
// ========================================
function registerUser(ss, data) {

  const userSheet = ss.getSheetByName('users');

  if (!userSheet) {
    return jsonResponse({
      success: false,
      error: 'Sheet users not found'
    });
  }

  const users = userSheet.getDataRange().getValues();

  const email = (data.email || '').toLowerCase().trim();
  const name = data.name || 'User';

  // ========================================
  // CHECK EXISTING USER
  // ========================================
  for (let i = 1; i < users.length; i++) {

    const existingEmail = String(users[i][1] || '')
      .toLowerCase()
      .trim();

    if (existingEmail === email) {

      return jsonResponse({
        success: true,
        existing: true,
        user_id: users[i][0],
        email: users[i][1],
        name: users[i][2],
        role: users[i][3] || 'student'
      });
    }
  }

  // ========================================
  // CREATE NEW USER
  // ========================================
  const userId = Utilities.getUuid().slice(0, 8);

  userSheet.appendRow([
    userId,
    email,
    name,
    'student',
    new Date()
  ]);

  return jsonResponse({
    success: true,
    existing: false,
    user_id: userId,
    email: email,
    name: name,
    role: 'student'
  });
}

// ========================================
// SAVE EXAM RESULT
// ========================================
function saveResult(ss, data) {

  const resultSheet = ss.getSheetByName('results');

  if (!resultSheet) {
    return jsonResponse({
      success: false,
      error: 'Sheet results not found'
    });
  }

  const resultId = Utilities.getUuid().slice(0, 8);

  resultSheet.appendRow([
    resultId,
    data.user_id || '',
    data.exam_path || '',
    Number(data.score || 0),
    Number(data.total_questions || 0),
    Number(data.time_used || 0),
    new Date()
  ]);

  return jsonResponse({
    success: true,
    result_id: resultId
  });
}

// ========================================
// CHECK USER
// ========================================
function checkUser(ss, email) {

  const userSheet = ss.getSheetByName('users');

  if (!userSheet) {
    return jsonResponse({
      success: false,
      error: 'Sheet users not found'
    });
  }

  const users = userSheet.getDataRange().getValues();

  const targetEmail = String(email || '')
    .toLowerCase()
    .trim();

  for (let i = 1; i < users.length; i++) {

    const existingEmail = String(users[i][1] || '')
      .toLowerCase()
      .trim();

    if (existingEmail === targetEmail) {

      return jsonResponse({
        success: true,
        user_id: users[i][0],
        email: users[i][1],
        name: users[i][2],
        role: users[i][3] || 'student'
      });
    }
  }

  return jsonResponse({
    success: false,
    message: 'User not found'
  });
}

// ========================================
// VERIFY PAYMENT
// ========================================
function verifyPayment(ss, data) {

  const paymentSheet = ss.getSheetByName('payments');

  if (!paymentSheet) {
    return jsonResponse({
      success: false,
      error: 'Sheet payments not found'
    });
  }

  const payments = paymentSheet.getDataRange().getValues();

  const orderId = data.order_id || '';

  for (let i = 1; i < payments.length; i++) {

    // CONTOH:
    // A = payment_id
    // B = user_id
    // C = plan
    // D = amount
    // E = order_id
    // F = status

    if (payments[i][4] == orderId) {

      // UPDATE STATUS
      paymentSheet.getRange(i + 1, 6).setValue('paid');

      const userId = payments[i][1];
      const plan = data.plan || 'premium';

      // UPDATE USER ROLE
      const userSheet = ss.getSheetByName('users');
      const users = userSheet.getDataRange().getValues();

      for (let j = 1; j < users.length; j++) {

        if (users[j][0] == userId) {

          userSheet.getRange(j + 1, 4).setValue(plan);

          break;
        }
      }

      return jsonResponse({
        success: true,
        order_id: orderId,
        plan: plan
      });
    }
  }

  return jsonResponse({
    success: false,
    error: 'Payment not found'
  });
}

// ========================================
// JSON RESPONSE + CORS FIX
// ========================================
function jsonResponse(obj) {

  const output = ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);

  return output;
}

// ========================================
// HTML INCLUDE
// ========================================
function include(filename) {
  return HtmlService
    .createHtmlOutputFromFile(filename)
    .getContent();
}