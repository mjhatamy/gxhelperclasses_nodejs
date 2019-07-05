

process.env.AWS_ADMIN_ALERT_SOURCE_EMAIL_ADDRESS = "adminAlert@gixconnect.com";
process.env.AWS_ADMIN_ALERT_DST_EMAIL_ADDRESS = "mjhatamy@gmail.com";
process.env.AWSRegion = "us-west-2";
process.env.AWS_ADMIN_ALERT_PHONE_NUMBER = "19257053143";

const { GXAdminAlert, GXADMIN_ALERT_TYPE } = require('./index.js');


console.log("TEST");

try {
    const gxAdminAlert = new GXAdminAlert();
    gxAdminAlert.notify("Test subject", "test message", GXADMIN_ALERT_TYPE.URGENT);
} catch (e) {
    console.error("Error: ", e);
}