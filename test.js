

process.env.AWS_ADMIN_ALERT_SOURCE_EMAIL_ADDRESS = "adminAlert@gixconnect.com";
process.env.AWS_ADMIN_ALERT_DST_EMAIL_ADDRESS = "mjhatamy@gmail.com";
process.env.AWSRegion = "us-west-2";

const { GXAdminAlert } = require('./index.js');


console.log("TEST");

try {
    const gxAdminAlert = new GXAdminAlert();
} catch (e) {
    console.error("Error: ", e);
}