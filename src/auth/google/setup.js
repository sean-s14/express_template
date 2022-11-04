require("dotenv").config();
const { GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, PROTOCOL, DOMAIN, PORT } = process.env;

const {google} = require('googleapis');

const googleSetup = () => {
    const oauth2Client = new google.auth.OAuth2(
        GOOGLE_CLIENT_ID,
        GOOGLE_CLIENT_SECRET,
        `${PROTOCOL}://${DOMAIN}:${PORT}/google/callback`,
    );
    
    const scopeBaseUrl = "https://www.googleapis.com/auth"
    
    const authorizationUrl = oauth2Client.generateAuthUrl({
        // 'online' (default) or 'offline' (gets refresh_token)
        access_type: 'offline',
        /** Pass in the scopes array defined above.
          * Alternatively, if only one scope is needed, you can pass a scope URL as a string */
        scope: [
            `${scopeBaseUrl}/userinfo.email`,
            `${scopeBaseUrl}/userinfo.profile`,
        ],
        // Enable incremental authorization. Recommended as a best practice.
        include_granted_scopes: true
    });

    return { oauth2Client, authorizationUrl}
}

module.exports = googleSetup;