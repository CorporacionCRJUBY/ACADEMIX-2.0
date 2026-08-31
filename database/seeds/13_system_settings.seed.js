// FILE: database/seeds/13_system_settings.seed.js
// Default global settings (user_id = NULL) per Plan §81 SYSTEM SETTINGS.
// These are read at runtime (e.g. gpa.service.js -> getGpaScale()) so that
// business rules like the GPA scale (Rule 55) are configurable from
// Settings instead of hardcoded in the application code.
exports.seed = async function (knex) {
  await knex('system_settings').where({ user_id: null }).del();

  const defaults = [
    // School Information (§83)
    { setting_key: 'school_name', setting_value: 'New Direction Academy' },
    { setting_key: 'school_address', setting_value: '3501 W Vine Street Suite, 225, Kissimmee FL 34741' },
    { setting_key: 'school_phone', setting_value: '407-201-6767' },
    { setting_key: 'school_motto', setting_value: 'A SCHOOL WHERE EVERYONE IS SOMEONE' },
    { setting_key: 'school_code', setting_value: 'NDA' },

    // Academic Year / Language / Format (§81, Rule 1)
    { setting_key: 'default_academic_year', setting_value: '2026-2027' },
    { setting_key: 'default_language', setting_value: 'en' },
    { setting_key: 'date_format', setting_value: 'MM/DD/YYYY' },
    { setting_key: 'time_format', setting_value: '12h' },
    { setting_key: 'time_zone', setting_value: 'America/New_York' },

    // GPA Scale / Credit Rules (§55, §56, Rule 55)
    { setting_key: 'gpa_scale', setting_value: '4.0' },
    { setting_key: 'min_gpa_to_graduate', setting_value: '2.0' },
    { setting_key: 'required_credits_to_graduate', setting_value: '24' },

    // Attendance / Grade Settings (§26, §36)
    { setting_key: 'grade_edit_window_hours', setting_value: '24' },
    { setting_key: 'attendance_edit_requires_permission', setting_value: 'true' },

    // Report Settings (§69, §70)
    { setting_key: 'report_default_paper_size', setting_value: 'Letter' },
    { setting_key: 'report_monthly_attendance_orientation', setting_value: 'Landscape' },

    // File Settings (§95)
    { setting_key: 'max_upload_size_mb', setting_value: '10' },
    { setting_key: 'allowed_document_extensions', setting_value: 'pdf,jpg,jpeg,png' },
  ];

  await knex('system_settings').insert(
    defaults.map((d) => ({ user_id: null, ...d, created_at: knex.fn.now(), updated_at: knex.fn.now() }))
  );
};
