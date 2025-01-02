import multer from "multer";
const upload = multer({ dest: "uploads/" });
export const csvUpload = upload.single("file");
