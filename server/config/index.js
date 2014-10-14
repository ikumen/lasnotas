module.exports = {
	server: {
		port: process.env.server_port || 8080
		, viewsDir: './server/views'
	}
	, security: {
		registration: {
			invites: [ 'thong@gnoht.com' ]
		}
		, oauth: {
			google: {
				clientID: (process.env.oauth_google_client_id || "1089952096747-qoi69k4gnhsafap6ajr1oftlgg6d4kan.apps.googleusercontent.com")
				, clientSecret: (process.env.oauth_google_client_secret || "8j8ik8X7wcAmlBb5Qsd49bA4")
				, callbackURL: 'http://localhost:8080/signin/google/callback'
			}
		}
	}
}