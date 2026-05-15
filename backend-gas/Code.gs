// ========================================
// NIHONGO MASTERY - GOOGLE APPS SCRIPT API
// FINAL FIXED VERSION 2026
// RESULTS + PAYMENTS + MEMBERSHIP
// ========================================

// ========================================
// CONFIG
// ========================================
const SHEET_ID =
  '1fOH-0m6afdeZwjFfORs1spjhr2EYD8rtlwRK843wZDw';

const ADMIN_KEY =
  'nihongo_mastery_admin_2026';

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
// MAIN ROUTER
// ========================================
function handleRequest(e) {

  try {

    let data = {};

    // ========================================
    // GET PARAMS
    // ========================================
    if (e && e.parameter) {

      data = e.parameter;

    }

    // ========================================
    // POST JSON BODY
    // ========================================
    if (
      e &&
      e.postData &&
      e.postData.contents
    ) {

      try {

        const jsonData =
          JSON.parse(
            e.postData.contents
          );

        data = {
          ...data,
          ...jsonData
        };

      } catch (err) {

        console.log(
          'JSON parse failed'
        );

      }

    }

    console.log(
      'REQUEST:',
      JSON.stringify(data)
    );

    // ========================================
    // ACTION
    // ========================================
    const action =
      String(
        data.action ||
        data.method ||
        ''
      ).trim();

    console.log(
      'ACTION:',
      action
    );

    // ========================================
    // OPEN SPREADSHEET
    // ========================================
    const ss =
      SpreadsheetApp.openById(
        SHEET_ID
      );

    // ========================================
    // ROUTER
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
      // MEMBERSHIP
      // ========================================
      case 'membership':

        return getMembership(
          ss,
          data.user_id
        );

      // ========================================
      // REGISTER
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
          ss,
          data
        );

      // ========================================
      // INVALID ACTION
      // ========================================
      default:

        return jsonResponse({

          success: false,
          error: 'Invalid action',
          received_action: action

        });

    }

  } catch (err) {

    console.error(err);

    return jsonResponse({

      success: false,
      error: err.toString()

    });

  }

}

// ========================================
// REGISTER USER
// ========================================
function registerUser(
  ss,
  data
) {

  const sheet =
    ss.getSheetByName(
      'users'
    );

  if (!sheet) {

    return jsonResponse({

      success: false,
      error:
        'Sheet users not found'

    });

  }

  const rows =
    sheet
    .getDataRange()
    .getValues();

  const email =
    String(
      data.email || ''
    )
    .trim()
    .toLowerCase();

  const name =
    String(
      data.name || 'User'
    );

  // ========================================
  // VALIDATE EMAIL
  // ========================================
  if (
    !email ||
    !email.includes('@')
  ) {

    return jsonResponse({

      success: false,
      error: 'Invalid email'

    });

  }

  // ========================================
  // CHECK EXISTING USER
  // ========================================
  for (
    let i = 1;
    i < rows.length;
    i++
  ) {

    const existingEmail =
      String(
        rows[i][1] || ''
      )
      .trim()
      .toLowerCase();

    if (
      existingEmail === email
    ) {

      return jsonResponse({

        success: true,
        existing: true,

        user_id:
          rows[i][0],

        email:
          rows[i][1],

        name:
          rows[i][2],

        role:
          getUserRole(
            rows[i]
          ),

        premium_expired:
          rows[i][4] || ''

      });

    }

  }

  // ========================================
  // CREATE USER
  // ========================================
  const userId =
    Utilities
    .getUuid()
    .slice(0, 8);

  sheet.appendRow([

    userId,
    email,
    name,
    'free',
    '',
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
      'free',

    premium_expired:
      ''

  });

}

// ========================================
// CHECK USER
// ========================================
function checkUser(
  ss,
  email
) {

  const sheet =
    ss.getSheetByName(
      'users'
    );

  if (!sheet) {

    return jsonResponse({

      success: false,
      error:
        'Sheet users not found'

    });

  }

  const rows =
    sheet
    .getDataRange()
    .getValues();

  const targetEmail =
    String(email || '')
    .trim()
    .toLowerCase();

  for (
    let i = 1;
    i < rows.length;
    i++
  ) {

    const existingEmail =
      String(
        rows[i][1] || ''
      )
      .trim()
      .toLowerCase();

    if (
      existingEmail ===
      targetEmail
    ) {

      return jsonResponse({

        success: true,

        user_id:
          rows[i][0],

        email:
          rows[i][1],

        name:
          rows[i][2],

        role:
          getUserRole(
            rows[i]
          ),

        premium_expired:
          rows[i][4] || ''

      });

    }

  }

  return jsonResponse({

    success: false,
    error:
      'User not found'

  });

}

// ========================================
// MEMBERSHIP
// ========================================
function getMembership(
  ss,
  userId
) {

  const sheet =
    ss.getSheetByName(
      'users'
    );

  if (!sheet) {

    return jsonResponse({

      success: false,
      error:
        'Sheet users not found'

    });

  }

  const rows =
    sheet
    .getDataRange()
    .getValues();

  for (
    let i = 1;
    i < rows.length;
    i++
  ) {

    if (
      String(rows[i][0]) ===
      String(userId)
    ) {

      return jsonResponse({

        success: true,

        user_id:
          rows[i][0],

        name:
          rows[i][2],

        role:
          getUserRole(
            rows[i]
          ),

        premium_expired:
          rows[i][4] || ''

      });

    }

  }

  return jsonResponse({

    success: false,
    error:
      'User not found'

  });

}

// ========================================
// SAVE RESULT
// ========================================
function saveResult(
  ss,
  data
) {

  const sheet =
    ss.getSheetByName(
      'results'
    );

  if (!sheet) {

    return jsonResponse({

      success: false,
      error:
        'Sheet results not found'

    });

  }

  const resultId =
    Utilities
    .getUuid()
    .slice(0, 8);

  sheet.appendRow([

    resultId,

    String(
      data.user_id || ''
    ),

    String(
      data.exam_path ||
      data.path ||
      data.exam ||
      ''
    ),

    Number(
      data.score || 0
    ),

    Number(
      data.total_questions || 0
    ),

    Number(
      data.time_used || 0
    ),

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

  const sheet =
    ss.getSheetByName(
      'results'
    );

  if (!sheet) {

    return jsonResponse({

      success: false,
      error:
        'Sheet results not found'

    });

  }

  const rows =
    sheet
    .getDataRange()
    .getValues();

  let results = [];

  for (
    let i = 1;
    i < rows.length;
    i++
  ) {

    const rowUserId =
      String(
        rows[i][1] || ''
      );

    if (
      rowUserId ===
      String(userId)
    ) {

      results.push({

        id:
          rows[i][0],

        user_id:
          rows[i][1],

        exam_path:
          rows[i][2],

        score:
          rows[i][3],

        total_questions:
          rows[i][4],

        time_used:
          rows[i][5],

        date:
          formatDate(
            rows[i][6]
          )

      });

    }

  }

  // ========================================
  // SORT NEWEST FIRST
  // ========================================
  results.reverse();

  return jsonResponse({

    success: true,

    total:
      results.length,

    results:
      results

  });

}

// ========================================
// SUBMIT PAYMENT
// ========================================
function submitPayment(
  ss,
  data
) {

  const lock =
    LockService
    .getScriptLock();

  lock.waitLock(5000);

  try {

    const sheet =
      ss.getSheetByName(
        'payments'
      );

    if (!sheet) {

      return jsonResponse({

        success: false,
        error:
          'Sheet payments not found'

      });

    }

    const orderId =
      String(
        data.order_id || ''
      ).trim();

    if (!orderId) {

      return jsonResponse({

        success: false,
        error:
          'Order ID kosong'

      });

    }

    const rows =
      sheet
      .getDataRange()
      .getValues();

    // ========================================
    // UPDATE EXISTING PAYMENT
    // ========================================
    for (
      let i = 1;
      i < rows.length;
      i++
    ) {

      const existingOrderId =
        String(
          rows[i][4] || ''
        ).trim();

      if (
        existingOrderId ===
        orderId
      ) {

        sheet
          .getRange(i + 1, 2)
          .setValue(
            data.user_id || ''
          );

        sheet
          .getRange(i + 1, 3)
          .setValue(
            data.plan || 'premium'
          );

        sheet
          .getRange(i + 1, 4)
          .setValue(
            Number(
              data.amount || 0
            )
          );

        sheet
          .getRange(i + 1, 6)
          .setValue(
            'pending'
          );

        if (data.proof) {

          sheet
            .getRange(i + 1, 7)
            .setValue(
              data.proof
            );

        }

        sheet
          .getRange(i + 1, 8)
          .setValue(
            new Date()
          );

        return jsonResponse({

          success: true,
          updated: true,

          order_id:
            orderId,

          status:
            'pending'

        });

      }

    }

    // ========================================
    // CREATE NEW PAYMENT
    // ========================================
    const paymentId =
      Utilities
      .getUuid()
      .slice(0, 8);

    sheet.appendRow([

      paymentId,

      data.user_id || '',

      data.plan || 'premium',

      Number(
        data.amount || 0
      ),

      orderId,

      'pending',

      data.proof || '',

      new Date()

    ]);

    return jsonResponse({

      success: true,
      created: true,

      payment_id:
        paymentId,

      order_id:
        orderId,

      status:
        'pending'

    });

  } finally {

    lock.releaseLock();

  }

}

// ========================================
// APPROVE PAYMENT
// ========================================
function approvePayment(
  ss,
  data
) {

  // ========================================
  // ADMIN SECURITY
  // ========================================
  if (
    data.admin_key !==
    ADMIN_KEY
  ) {

    return jsonResponse({

      success: false,
      error:
        'Unauthorized'

    });

  }

  const paymentSheet =
    ss.getSheetByName(
      'payments'
    );

  const userSheet =
    ss.getSheetByName(
      'users'
    );

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

  const orderId =
    String(
      data.order_id || ''
    ).trim();

  const payments =
    paymentSheet
    .getDataRange()
    .getValues();

  let userId = '';

  // ========================================
  // UPDATE PAYMENT STATUS
  // ========================================
  for (
    let i = 1;
    i < payments.length;
    i++
  ) {

    const currentOrderId =
      String(
        payments[i][4] || ''
      ).trim();

    if (
      currentOrderId ===
      orderId
    ) {

      paymentSheet
        .getRange(i + 1, 6)
        .setValue(
          'approved'
        );

      userId =
        String(
          payments[i][1] || ''
        );

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
  // UPDATE USER PREMIUM
  // ========================================
  const users =
    userSheet
    .getDataRange()
    .getValues();

  for (
    let i = 1;
    i < users.length;
    i++
  ) {

    const currentUserId =
      String(
        users[i][0] || ''
      );

    if (
      currentUserId ===
      userId
    ) {

      // ========================================
      // PREMIUM 30 DAYS
      // ========================================
      const expired =
        new Date();

      expired.setDate(
        expired.getDate() + 30
      );

      // ROLE
      userSheet
        .getRange(i + 1, 4)
        .setValue(
          'premium'
        );

      // EXPIRED DATE
      userSheet
        .getRange(i + 1, 5)
        .setValue(
          expired
        );

      break;

    }

  }

  SpreadsheetApp.flush();

  return jsonResponse({

    success: true,

    order_id:
      orderId,

    user_id:
      userId,

    role:
      'premium',

    status:
      'approved'

  });

}

// ========================================
// GET PENDING PAYMENTS
// ========================================
function getPendingPayments(
  ss,
  data
) {

  // ========================================
  // ADMIN SECURITY
  // ========================================
  if (
    data.admin_key !==
    ADMIN_KEY
  ) {

    return jsonResponse({

      success: false,
      error:
        'Unauthorized'

    });

  }

  const sheet =
    ss.getSheetByName(
      'payments'
    );

  if (!sheet) {

    return jsonResponse({

      success: false,
      error:
        'Sheet payments not found'

    });

  }

  const rows =
    sheet
    .getDataRange()
    .getValues();

  let payments = [];

  for (
    let i = 1;
    i < rows.length;
    i++
  ) {

    const status =
      String(
        rows[i][5] || ''
      );

    if (
      status ===
      'pending'
    ) {

      payments.push({

        id:
          rows[i][0],

        user_id:
          rows[i][1],

        plan:
          rows[i][2],

        amount:
          rows[i][3],

        order_id:
          rows[i][4],

        status:
          rows[i][5],

        proof:
          rows[i][6] || '',

        date:
          formatDate(
            rows[i][7]
          )

      });

    }

  }

  return jsonResponse({

    success: true,

    total:
      payments.length,

    payments:
      payments

  });

}

// ========================================
// FORMAT DATE
// ========================================
function formatDate(
  dateObj
) {

  if (!dateObj) {

    return '-';

  }

  return Utilities.formatDate(

    new Date(dateObj),

    Session
    .getScriptTimeZone(),

    'yyyy-MM-dd HH:mm'

  );

}

// ========================================
// GET USER ROLE
// ========================================
function getUserRole(
  userRow
) {

  const role =
    String(
      userRow[3] || 'free'
    );

  const expired =
    userRow[4];

  // ========================================
  // NOT PREMIUM
  // ========================================
  if (
    role !== 'premium'
  ) {

    return 'free';

  }

  // ========================================
  // NO EXPIRED DATE
  // ========================================
  if (!expired) {

    return 'free';

  }

  // ========================================
  // CHECK DATE
  // ========================================
  const today =
    new Date();

  const expDate =
    new Date(expired);

  today.setHours(
    0, 0, 0, 0
  );

  expDate.setHours(
    0, 0, 0, 0
  );

  return expDate >= today
    ? 'premium'
    : 'free';

}

// ========================================
// JSON RESPONSE
// ========================================
function jsonResponse(
  data
) {

  return ContentService
    .createTextOutput(
      JSON.stringify(data)
    )
    .setMimeType(
      ContentService
      .MimeType
      .JSON
    );

}

// ========================================
// HTML INCLUDE
// ========================================
function include(
  filename
) {

  return HtmlService
    .createHtmlOutputFromFile(
      filename
    )
    .getContent();

}