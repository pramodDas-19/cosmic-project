const puppeteer = require("puppeteer");
const path = require("path");
const fs = require("fs");

const Project = require("../models/Project");

const generateOverallReport = async (req, res) => {
  try {
    // ================= DATA =================
    const totalProjects = await Project.countDocuments();
    const completedProjects = await Project.countDocuments({ status: "Completed" });
    const inProgressProjects = await Project.countDocuments({ status: "In Progress" });
    const delayedProjects = await Project.countDocuments({ status: "Delayed" });

    const completionRate =
  totalProjects > 0
    ? ((completedProjects / totalProjects) * 100).toFixed(2)
    : "0.00";

const averageDuration = 28; // Example (replace later with real logic)

const budgetStatus = "Within Budget"; // Placeholder (professional wording)

    // ================= FILES =================
    const templateDir = path.join(__dirname, "../templates");

    const htmlPath = path.join(templateDir, "overallReport.html");
    const cssPath = path.join(templateDir, "report.css");
    const logoPath = path.join(templateDir, "logo-cosmic.png");

    let html = fs.readFileSync(htmlPath, "utf8");
    const css = fs.readFileSync(cssPath, "utf8");
    const logoBase64 = fs.readFileSync(logoPath).toString("base64");

    // ================= INJECT DATA =================
  // ================= INJECT DATA =================
html = html
  html = html
  .replace("{{LOGO}}", `data:image/png;base64,${logoBase64}`)
  .replace(/{{totalProjects}}/g, totalProjects)
  .replace(/{{completedProjects}}/g, completedProjects)
  .replace(/{{inProgressProjects}}/g, inProgressProjects)
  .replace(/{{delayedProjects}}/g, delayedProjects)
  .replace(/{{completionRate}}/g, completionRate)
  .replace(/{{averageDuration}}/g, averageDuration)
  .replace(/{{budgetStatus}}/g, budgetStatus)
  .replace(/{{generatedAt}}/g, new Date().toLocaleString())
  .replace(/{{year}}/g, new Date().getFullYear());


    // ================= PUPPETEER =================
    const browser = await puppeteer.launch({
      headless: "new",
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });

    const page = await browser.newPage();

    await page.setContent(html, {
      waitUntil: ["domcontentloaded", "networkidle0"],
    });
    

// ✅ Inject CSS PROPERLY
await page.addStyleTag({
  path: path.join(templateDir, "report.css"),
});


    const pdfBuffer = await page.pdf({
      format: "A4",
      printBackground: true,
      preferCSSPageSize: true,
    });

    await browser.close();

    // ================= RESPONSE =================
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      "attachment; filename=Cosmic_Project_Summary.pdf"
    );

    return res.end(pdfBuffer);
  } catch (err) {
    console.error("PDF ERROR:", err);
    return res.status(500).json({
      status: "error",
      message: "PDF generation failed",
    });
  }
};

const generateTaskReport = async (req, res) => {
  res.status(501).json({
    status: "error",
    message: "Task report not implemented yet",
  });
};

module.exports = {
  generateOverallReport,
  generateTaskReport,
};
