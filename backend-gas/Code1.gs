// ========================================
// NIHONGO MASTERY - GOOGLE APPS SCRIPT API
// FINAL FIXED VERSION 2026
// ========================================

// ========================================
// CONFIG
// ========================================
const SHEET_ID =
  '1fOH-0m6afdeZwjFfORs1spjhr2EYD8rtlwRK843wZDw';

// ========================================
// MAIN HANDLER
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
// MAIN ROUTER
// ========================================
function handleRequest(e) {

  try {

    let data = {};

    // ========================================
    // GET PARAMS
    // ========================================
    if (e.parameter && e.parameter.action) {

      data = e.parameter;

    }

    // ========================================
    // POST JSON
    // ========================================
    else if (
      e.postData &&
      e.postData.contents
    ) {

      try {

        data =
          JSON.parse(e.postData.contents);

      } catch (err) {

        data = e.parameter || {};

      }
    }

    const action =
      String(data.action || '').trim();

    console.log('ACTION:', action);
    console.log('DATA:', JSON.stringify(data));

    const ss =
      SpreadsheetApp.openById(SHEET_ID);

    // ========================================
    // ROUTING
    // ========================================
    switch (action) {

      // ========================================
      // PING
      // ========================================
      case 'ping':

        return jsonResponse({
          success: true,
          message: 'API ONLINE',
          time: new Date()
        });

      // ========================================
      // REGISTER
      // ========================================
      case 'register':

        return registerUser(ss, data);

      // ========================================
      // CHECK USER
      // ========================================
      case 'check_user':

        return checkUser(
          ss,
          data.email
        );

      // ========================================
      // SAVE RESULT
      // ========================================
      case 'save_result':

        return saveResult(ss, data);

      // ========================================
      // SUBMIT PAYMENT
      // ========================================
      case 'submit_payment':

        return submitPayment(ss, data);

      // ========================================
      // APPROVE PAYMENT
      // ========================================
      case 'approve_payment':

        return approvePayment(ss, data);

      // ========================================
      // GET PENDING PAYMENTS
      // ========================================
      case 'get_pending_payments':

        return getPendingPayments(ss);

      // ========================================
      // INVALID ACTION
      // ========================================
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

  const userSheet =
    ss.getSheetByName('users');

  if (!userSheet) {

    return jsonResponse({
      success: false,
      error: 'Sheet users not found'
    });

  }

  const users =
    userSheet.getDataRange().getValues();

  const email =
    String(data.email || '')
    .toLowerCase()
    .trim();

  const name =
    String(data.name || 'User');

  // ========================================
  // CHECK EXISTING USER
  // ========================================
  for (let i = 1; i < users.length; i++) {

    const existingEmail =
      String(users[i][1] || '')
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
  // CREATE USER
  // ========================================
  const userId =
    Utilities.getUuid().slice(0, 8);

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
// CHECK USER
// ========================================
function checkUser(ss, email) {

  const userSheet =
    ss.getSheetByName('users');

  if (!userSheet) {

    return jsonResponse({
      success: false,
      error: 'Sheet users not found'
    });

  }

  const users =
    userSheet.getDataRange().getValues();

  const targetEmail =
    String(email || '')
    .toLowerCase()
    .trim();

  for (let i = 1; i < users.length; i++) {

    const existingEmail =
      String(users[i][1] || '')
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
    error: 'User not found'

  });

}

// ========================================
// SAVE RESULT
// ========================================
function saveResult(ss, data) {

  const resultSheet =
    ss.getSheetByName('results');

  if (!resultSheet) {

    return jsonResponse({
      success: false,
      error: 'Sheet results not found'
    });

  }

  const resultId =
    Utilities.getUuid().slice(0, 8);

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
// SUBMIT PAYMENT
// ========================================
// SHEET payments FORMAT:
// A = id
// B = user_id
// C = plan
// D = amount
// E = order_id
// F = status
// G = proof
// H = date
// ========================================
function submitPayment(ss, data) {

  const paymentSheet =
    ss.getSheetByName('payments');

  if (!paymentSheet) {

    return jsonResponse({
      success: false,
      error: 'Sheet payments not found'
    });

  }

  const paymentId =
    Utilities.getUuid().slice(0, 8);

  paymentSheet.appendRow([

    paymentId,
    data.user_id || '',
    data.plan || 'premium',
    Number(data.amount || 0),
    data.order_id || '',
    'pending',
    data.proof || '',
    new Date()

  ]);

  return jsonResponse({

    success: true,
    payment_id: paymentId,
    status: 'pending'

  });

}

// ========================================
// APPROVE PAYMENT
// ========================================
function approvePayment(ss, data) {

  const paymentSheet =
    ss.getSheetByName('payments');

  const userSheet =
    ss.getSheetByName('users');

  if (!paymentSheet || !userSheet) {

    return jsonResponse({
      success: false,
      error: 'Sheet not found'
    });

  }

  const payments =
    paymentSheet.getDataRange().getValues();

  const orderId =
    data.order_id || '';

  let userId = '';
  let plan = 'premium';

  // ========================================
  // UPDATE PAYMENT STATUS
  // ========================================
  for (let i = 1; i < payments.length; i++) {

    if (payments[i][4] == orderId) {

      paymentSheet
        .getRange(i + 1, 6)
        .setValue('approved');

      userId =
        payments[i][1];

      plan =
        payments[i][2];

      break;

    }

  }

  if (!userId) {

    return jsonResponse({
      success: false,
      error: 'Payment not found'
    });

  }

  // ========================================
  // UPDATE USER ROLE
  // ========================================
  const users =
    userSheet.getDataRange().getValues();

  for (let i = 1; i < users.length; i++) {

    if (users[i][0] == userId) {

      userSheet
        .getRange(i + 1, 4)
        .setValue(plan);

      break;

    }

  }

  return jsonResponse({

    success: true,
    user_id: userId,
    role: plan,
    order_id: orderId

  });

}

// ========================================
// GET PENDING PAYMENTS
// ========================================
function getPendingPayments(ss) {

  const paymentSheet =
    ss.getSheetByName('payments');

  if (!paymentSheet) {

    return jsonResponse({
      success: false,
      error: 'Sheet payments not found'
    });

  }

  const payments =
    paymentSheet.getDataRange().getValues();

  let result = [];

  for (let i = 1; i < payments.length; i++) {

    if (
      String(payments[i][5]) ===
      'pending'
    ) {

      result.push({

        id: payments[i][0],
        user_id: payments[i][1],
        plan: payments[i][2],
        amount: payments[i][3],
        order_id: payments[i][4],
        status: payments[i][5],
        proof: payments[i][6] || '',
        date: payments[i][7]

      });

    }

  }

  return jsonResponse({

    success: true,
    payments: result

  });

}

// ========================================
// JSON RESPONSE
// ========================================
function jsonResponse(obj) {

  return ContentService
    .createTextOutput(
      JSON.stringify(obj)
    )
    .setMimeType(
      ContentService.MimeType.JSON
    );

}

// ========================================
// HTML INCLUDE
// ========================================
function include(filename) {

  return HtmlService
    .createHtmlOutputFromFile(filename)
    .getContent();

}