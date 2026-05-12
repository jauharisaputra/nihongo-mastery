// ========================================
// NIHONGO MASTERY - GOOGLE APPS SCRIPT API
// FINAL FIXED VERSION 2026
// SUPPORT RESULTS DASHBOARD
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
// OPTIONS / CORS
// ========================================
function doOptions() {

  return ContentService
    .createTextOutput('')
    .setMimeType(
      ContentService.MimeType.TEXT
    );

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
    if (e.parameter) {

      data = e.parameter;

    }

    // ========================================
    // POST JSON
    // ========================================
    if (
      e.postData &&
      e.postData.contents
    ) {

      try {

        const jsonData =
          JSON.parse(e.postData.contents);

        data = {
          ...data,
          ...jsonData
        };

      } catch (err) {

        console.log('JSON parse failed');

      }

    }

    console.log(
      'REQUEST:',
      JSON.stringify(data)
    );

    // ========================================
    // ACTION / METHOD
    // ========================================
    const action =
      String(
        data.action ||
        data.method ||
        ''
      ).trim();

    console.log('ACTION:', action);

    // ========================================
    // OPEN SPREADSHEET
    // ========================================
    const ss =
      SpreadsheetApp.openById(
        SHEET_ID
      );

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
      // REGISTER USER
      // ========================================
      case 'register':

        return registerUser(
          ss,
          data
        );

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

        return saveResult(
          ss,
          data
        );

      // ========================================
      // GET RESULTS
      // ========================================
      case 'results':

        return getResults(
          ss,
          data.user_id
        );

      // ========================================
      // SUBMIT PAYMENT
      // ========================================
      case 'submit_payment':

        return submitPayment(
          ss,
          data
        );

      // ========================================
      // APPROVE PAYMENT
      // ========================================
      case 'approve_payment':

        return approvePayment(
          ss,
          data
        );

      // ========================================
      // GET PENDING PAYMENTS
      // ========================================
      case 'get_pending_payments':

        return getPendingPayments(
          ss
        );

      // ========================================
      // INVALID ACTION
      // ========================================
      default:

        return jsonResponse({

          success: false,
          error:
            'Invalid action'

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
      error:
        'Sheet users not found'

    });

  }

  const users =
    userSheet
    .getDataRange()
    .getValues();

  const email =
    String(data.email || '')
    .trim()
    .toLowerCase();

  const name =
    String(data.name || 'User');

  // ========================================
  // CHECK EXISTING USER
  // ========================================
  for (let i = 1; i < users.length; i++) {

    const existingEmail =
      String(users[i][1] || '')
      .trim()
      .toLowerCase();

    if (
      existingEmail === email
    ) {

      return jsonResponse({

        success: true,
        existing: true,

        user_id:
          users[i][0],

        email:
          users[i][1],

        name:
          users[i][2],

        role:
          users[i][3] ||
          'student'

      });

    }

  }

  // ========================================
  // CREATE USER
  // ========================================
  const userId =
    Utilities.getUuid()
    .slice(0, 8);

  userSheet.appendRow([

    userId,
    email,
    name,
    'premium',
    new Date()

  ]);

  return jsonResponse({

    success: true,
    existing: false,

    user_id:
      userId,

    email:
      email,

    name:
      name,

    role:
      'premium'

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
      error:
        'Sheet users not found'

    });

  }

  const users =
    userSheet
    .getDataRange()
    .getValues();

  const targetEmail =
    String(email || '')
    .trim()
    .toLowerCase();

  for (let i = 1; i < users.length; i++) {

    const existingEmail =
      String(users[i][1] || '')
      .trim()
      .toLowerCase();

    if (
      existingEmail === targetEmail
    ) {

      return jsonResponse({

        success: true,

        user_id:
          users[i][0],

        email:
          users[i][1],

        name:
          users[i][2],

        role:
          users[i][3] ||
          'student'

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
      error:
        'Sheet results not found'

    });

  }

  const resultId =
    Utilities.getUuid()
    .slice(0, 8);

  const userId =
    String(data.user_id || '');

  const exam =
    String(
      data.exam ||
      data.exam_path ||
      ''
    );

  const score =
    Number(data.score || 0);

  const status =
    String(
      data.status ||
      'Selesai'
    );

  const nama =
    String(data.nama || '');

  const kelas =
    String(data.kelas || '');

  const mode =
    String(data.mode || '');

  const version =
    String(data.version || '');

  const path =
    String(data.path || '');

  resultSheet.appendRow([

    resultId,
    userId,
    exam,
    score,
    status,
    nama,
    kelas,
    mode,
    version,
    path,
    new Date()

  ]);

  return jsonResponse({

    success: true,
    result_id: resultId

  });

}

// ========================================
// GET RESULTS
// ========================================
function getResults(
  ss,
  userId
) {

  const resultSheet =
    ss.getSheetByName('results');

  if (!resultSheet) {

    return jsonResponse({

      success: false,
      error:
        'Sheet results not found'

    });

  }

  const rows =
    resultSheet
    .getDataRange()
    .getValues();

  let results = [];

  for (let i = 1; i < rows.length; i++) {

    const rowUserId =
      String(rows[i][1] || '');

    if (
      rowUserId ===
      String(userId)
    ) {

      results.push({

        id:
          rows[i][0],

        user_id:
          rows[i][1],

        exam:
          rows[i][2],

        score:
          rows[i][3],

        status:
          rows[i][4],

        nama:
          rows[i][5],

        kelas:
          rows[i][6],

        mode:
          rows[i][7],

        version:
          rows[i][8],

        path:
          rows[i][9],

        date:
          formatDate(
            rows[i][10]
          )

      });

    }

  }

  // ========================================
  // SORT TERBARU
  // ========================================
  results.reverse();

  return jsonResponse({

    success: true,
    total: results.length,
    results: results

  });

}

// ========================================
// SUBMIT PAYMENT
// ========================================
function submitPayment(
  ss,
  data
) {

  const paymentSheet =
    ss.getSheetByName('payments');

  if (!paymentSheet) {

    return jsonResponse({

      success: false,
      error:
        'Sheet payments not found'

    });

  }

  const paymentId =
    Utilities.getUuid()
    .slice(0, 8);

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
function approvePayment(
  ss,
  data
) {

  const paymentSheet =
    ss.getSheetByName('payments');

  const userSheet =
    ss.getSheetByName('users');

  if (
    !paymentSheet ||
    !userSheet
  ) {

    return jsonResponse({

      success: false,
      error:
        'Sheet not found'

    });

  }

  const payments =
    paymentSheet
    .getDataRange()
    .getValues();

  const orderId =
    data.order_id || '';

  let userId = '';
  let plan = 'premium';

  // ========================================
  // UPDATE PAYMENT
  // ========================================
  for (let i = 1; i < payments.length; i++) {

    if (
      payments[i][4] ==
      orderId
    ) {

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
      error:
        'Payment not found'

    });

  }

  // ========================================
  // UPDATE USER ROLE
  // ========================================
  const users =
    userSheet
    .getDataRange()
    .getValues();

  for (let i = 1; i < users.length; i++) {

    if (
      users[i][0] ==
      userId
    ) {

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
      error:
        'Sheet payments not found'

    });

  }

  const payments =
    paymentSheet
    .getDataRange()
    .getValues();

  let result = [];

  for (let i = 1; i < payments.length; i++) {

    if (
      String(payments[i][5]) ===
      'pending'
    ) {

      result.push({

        id:
          payments[i][0],

        user_id:
          payments[i][1],

        plan:
          payments[i][2],

        amount:
          payments[i][3],

        order_id:
          payments[i][4],

        status:
          payments[i][5],

        proof:
          payments[i][6],

        date:
          formatDate(
            payments[i][7]
          )

      });

    }

  }

  return jsonResponse({

    success: true,
    payments: result

  });

}

// ========================================
// FORMAT DATE
// ========================================
function formatDate(dateObj) {

  if (!dateObj) {

    return '-';

  }

  return Utilities.formatDate(

    new Date(dateObj),
    Session.getScriptTimeZone(),
    'yyyy-MM-dd HH:mm'

  );

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
    .createHtmlOutputFromFile(
      filename
    )
    .getContent();

}