const verifySecret = (req, res, next) => {
  try {
    const incomingShippingSecret = req.headers["shipping_secret_key"];
    const localSecretKey = process.env.SHIPPING_SECRET_KEY;

    if (!incomingShippingSecret) {
      return res.status(403).json({
        error: "SHIPPING_SECRET_KEY is missing or invalid",
      });
    }

    if (incomingShippingSecret !== localSecretKey) {
      return res.status(403).json({
        error: "Failed to authenticate SHIPPING_SECRET_KEY",
      });
    }
    next();
  } catch (error) {
    console.log(error.message);
    res.status(403).json({error:error})
  }
};
module.exports = { verifySecret };
