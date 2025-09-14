const asyncHandler = (func) => {
  return async (req, res, next) => {
    try {
      await func(req, res, next);
    } catch (error) {
      console.log("error", error);
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  };
};

module.exports =  asyncHandler 
