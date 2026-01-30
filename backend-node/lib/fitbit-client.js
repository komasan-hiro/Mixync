const axios = require('axios');
const { db } = require('./database');

// --- Helper function to refresh Fitbit token ---
const refreshFitbitToken = async (user) => {
    console.log('Refreshing Fitbit token for user:', user.id);
    const base64Credentials = Buffer.from(`${process.env.FITBIT_CLIENT_ID}:${process.env.FITBIT_CLIENT_SECRET}`).toString('base64');

    try {
        const response = await axios.post(
            'https://api.fitbit.com/oauth2/token',
            `grant_type=refresh_token&refresh_token=${user.fitbit_refresh_token}`,
            { headers: { 'Authorization': `Basic ${base64Credentials}`, 'Content-Type': 'application/x-www-form-urlencoded' } }
        );

        const { access_token, refresh_token } = response.data;

        // Update the new tokens in the database using better-sqlite3 sync API
        const stmt = db.prepare('UPDATE users SET fitbit_access_token = ?, fitbit_refresh_token = ? WHERE id = ?');
        stmt.run(access_token, refresh_token, user.id);
        console.log('Successfully updated Fitbit tokens for user:', user.id);

        return access_token; // Return the new access token

    } catch (error) {
        console.error('Error refreshing Fitbit token:', error.response ? error.response.data : error.message);
        throw new Error('Could not refresh Fitbit token.');
    }
};

// --- Helper function to make Fitbit API requests with auto-refresh ---
const fitbitApiRequest = async (url, user, retries = 1, options = {}) => {
    console.log('Making Fitbit API request to:', url);
    try {
        const response = await axios.get(url, { headers: { 'Authorization': `Bearer ${user.fitbit_access_token}` }, ...options });
        return response;
    } catch (error) {
        // If token is expired (401) and we haven't retried yet
        if (error.response && error.response.status === 401 && retries > 0) {
            console.log('Access token expired. Attempting to refresh...');
            try {
                const newAccessToken = await refreshFitbitToken(user);
                const updatedUser = { ...user, fitbit_access_token: newAccessToken };
                // Retry the request with the new token
                return fitbitApiRequest(url, updatedUser, retries - 1, options);
            } catch (refreshError) {
                console.error('Failed to refresh token during request retry:', refreshError.message);
                throw refreshError; // Re-throw if refresh fails
            }
        }
        // If rate limited (429) and we haven't retried yet
        if (error.response && error.response.status === 429 && retries > 0) {
            console.log('Rate limited. Waiting 1 second before retrying...');
            await new Promise(resolve => setTimeout(resolve, 1000));
            return fitbitApiRequest(url, user, retries - 1, options);
        }
        // For other errors or if retries are exhausted, re-throw the error
        throw error;
    }
};

module.exports = {
    fitbitApiRequest,
    refreshFitbitToken
};
