const app_config = {
    domain_name: '',
    org_name : '',
    org_address: "",
    db_config : {
        user: 'sa',
        password: 'nkiere',
        server: "localhost\\FINCASANTE",
        database: "admin_db",
        options: {
            "encrypt": false,
            "enableArithAbort": true
        }
    },
    local_currency: 'FC',
    user_lang: 'fr',
    secret : 'supersecret',
    password_policy : {
        max_failed_login_count : 3,
        days_before_force_change : 30,
        min_length : 10,
        max_length : 20,
        upercase_required: true,
        numeric_count: 1,
        special_required : true
    },
    mail_api : {
        api_key: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VybmFtZSI6ImpjbmltaSIsImlhdCI6MTY2NjAwNDc5OCwiZXhwIjoxNjY2MDExOTk4fQ.WPzzenZp8PA28E-kEaqND4fikYJkJzEdaGEwR88lSys',
        api_endpoint: ''
    },
    jwt_config : {
        acces_token_secret: 'swsh23hjddnns$swsh23hjddnns',
        access_token_life : '120'
    }
};

export default app_config;