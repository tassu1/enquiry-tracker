const router = require("express").Router();
const { protect } = require("../middleware/authMiddleware");
const { createEnquiry, getUnclaimedEnquiries, claimEnquiry, getMyEnquiries } = require("../controllers/enquiryController");
router.post("/", createEnquiry);
router.get("/unclaimed", protect, getUnclaimedEnquiries);
router.patch("/:id/claim", protect, claimEnquiry);
router.get("/my", protect, getMyEnquiries);
module.exports = router;
