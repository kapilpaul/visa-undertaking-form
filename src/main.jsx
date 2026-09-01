import React, { useMemo, useState } from "react";
import ReactGA from "react-ga4";
import { createRoot } from "react-dom/client";
import { SpeedInsights } from "@vercel/speed-insights/react";
import jsPDF from "jspdf";
import "./styles.css";

const initialForm = {
  fullName: "",
  passportNumber: "",
  nationality: "",
  dateOfBirth: "",
  address: "",
  purpose: "tourism",
  purposeOther: "",
  arrivalDate: "",
  departureDate: "",
  returnCountry: "",
  signedDate: ""
};

function formatDate(value) {
  if (!value) return "___________________";
  const d = new Date(`${value}T00:00:00`);
  return d.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric"
  });
}

function inclusiveDays(start, end) {
  if (!start || !end) return "";
  const a = new Date(`${start}T00:00:00`);
  const b = new Date(`${end}T00:00:00`);
  const diff = Math.round((b - a) / 86400000);
  return diff >= 0 ? diff + 1 : "";
}

function App() {
  const [form, setForm] = useState(initialForm);
  const days = useMemo(
    () => inclusiveDays(form.arrivalDate, form.departureDate),
    [form.arrivalDate, form.departureDate]
  );

  const update = (key, value) => setForm(prev => ({ ...prev, [key]: value }));

  const purposeText =
    form.purpose === "other" ? form.purposeOther || "other" : form.purpose;

  function reset() {
    setForm(initialForm);
  }

  function generatePDF() {
    const doc = new jsPDF({
      unit: "mm",
      format: "a4"
    });

    const pageWidth = 210;
    const margin = 18;
    const contentWidth = pageWidth - margin * 2;
    let y = 24;

    const addWrapped = (text, x, yPos, width, opts = {}) => {
      const fontSize = opts.fontSize || 11;
      const lineHeight = opts.lineHeight || 5.5;
      doc.setFont("Times", opts.bold ? "bold" : "normal");
      doc.setFontSize(fontSize);
      const lines = doc.splitTextToSize(text, width);
      doc.text(lines, x, yPos);
      return yPos + lines.length * lineHeight;
    };

    doc.setFont("Times", "bold");
    doc.setFontSize(15);
    doc.text("VISA UNDERTAKING FORM", pageWidth / 2, y, { align: "center" });
    y += 18;

    y = addWrapped(
      "I, the undersigned, hereby submit this undertaking in support of my application for an Indian visa.",
      margin, y, contentWidth, { fontSize: 11.5, lineHeight: 6 }
    ) + 7;

    const section = (number, title) => {
      doc.setFont("Times", "bold");
      doc.setFontSize(11.5);
      doc.text(`${number}.  ${title}`, margin, y);
      y += 7;
    };

    const field = (label, value) => {
      doc.setFont("Times", "normal");
      doc.setFontSize(11);
      doc.text(`${label}:`, margin + 5, y);
      if (value) {
        doc.text(String(value), margin + 36, y);
      } else {
        doc.line(margin + 35, y + 1, pageWidth - margin, y + 1);
      }
      y += 7;
    };

    section(1, "Personal Details");
    field("Full Name", form.fullName);
    field("Passport Number", form.passportNumber);
    field("Nationality", form.nationality);
    field("Date of Birth", formatDate(form.dateOfBirth));
    field("Address", form.address);
    y += 2;

    section(2, "Purpose of Visit");
    y = addWrapped(
      `I wish to visit India for the purpose of ${purposeText}.`,
      margin + 5, y, contentWidth - 5, { fontSize: 11, lineHeight: 5.5 }
    ) + 1;

    section(3, "Duration of Stay");
    const durationSentence =
      `I intend to stay in India from ${formatDate(form.arrivalDate)} to ${formatDate(form.departureDate)}, for a total period of ${days || "________"} days.`;
    y = addWrapped(durationSentence, margin + 5, y, contentWidth - 5, {
      fontSize: 11, lineHeight: 5.5
    }) + 7;

    section(4, "Return to Home Country");
    y = addWrapped(
      `I undertake to return to my home country immediately upon the completion of my visit, and I confirm that I have no intention of overstaying my visa in India. I will return to ${form.returnCountry || "________________"}.`,
      margin + 5, y, contentWidth - 5, { fontSize: 11, lineHeight: 5.5 }
    ) + 7;

    section(5, "Compliance with Indian Laws");
    y = addWrapped(
      "I hereby pledge to fully comply with the laws, regulations, and customs of India during my stay. I acknowledge that I will not engage in any activity that is prohibited under Indian law and will respect the local customs and culture.",
      margin + 5, y, contentWidth - 5, { fontSize: 11, lineHeight: 5.5 }
    ) + 7;

    section(6, "Acknowledgment and Declaration");
    y = addWrapped(
      "I understand that any violation of Indian laws or regulations may lead to the cancellation of my visa and may affect my future eligibility for a visa to India.",
      margin + 5, y, contentWidth - 5, { fontSize: 11, lineHeight: 5.5 }
    ) + 6;

    y = addWrapped(
      "I declare that all information provided in my visa application is accurate and truthful to the best of my knowledge. I understand that providing false or misleading information may result in the denial of my visa application.",
      margin + 5, y, contentWidth - 5, { fontSize: 11, lineHeight: 5.5 }
    ) + 6;

    y = addWrapped(
      "I undertake to adhere to all the terms and conditions of my visa and will ensure that I leave India before the expiration of my authorized stay.",
      margin, y, contentWidth, { fontSize: 11, lineHeight: 5.5 }
    ) + 16;

    doc.setFont("Times", "bold");
    doc.setFontSize(11);
    doc.text("Signature of Applicant:", margin, y);
    if (form.signatureName) {
      doc.setFont("Times", "normal");
      doc.text(form.signatureName, margin + 44, y);
    }

    y += 16;
    doc.setFont("Times", "bold");
    doc.text("Date:", margin, y);
    if (form.signedDate) {
      doc.setFont("Times", "normal");
      doc.text(formatDate(form.signedDate), margin + 14, y);
    }

    const safeName = (form.fullName || "applicant")
      .replace(/[^a-z0-9]+/gi, "-")
      .replace(/^-|-$/g, "")
      .toLowerCase();

    ReactGA.event({
      category: "PDF",
      action: "download",
      label: "Visa Undertaking Form"
    });

    doc.save(`visa-undertaking-form-${safeName || "applicant"}.pdf`);
  }

  return (
    <div className="app">
      <header>
        <div>
          <h1>Visa Undertaking Form</h1>
          <p>Fill in the details and download a ready-to-sign PDF.</p>
        </div>
      </header>

      <main className="layout">
        <section className="card form-card">
          <h2>Applicant details</h2>

          <div className="grid">
            <label>
              Full Name
              <input value={form.fullName} onChange={e => update("fullName", e.target.value)} placeholder="Full name" />
            </label>
            <label>
              Passport Number
              <input value={form.passportNumber} onChange={e => update("passportNumber", e.target.value)} placeholder="Passport number" />
            </label>
            <label>
              Nationality
              <input value={form.nationality} onChange={e => update("nationality", e.target.value)} placeholder="Nationality" />
            </label>
            <label>
              Date of Birth
              <input type="date" value={form.dateOfBirth} onChange={e => update("dateOfBirth", e.target.value)} />
            </label>
          </div>

          <label>
            Address
            <textarea value={form.address} onChange={e => update("address", e.target.value)} rows="2" placeholder="Current address" />
          </label>

          <h2>Trip details</h2>

          <label>
            Purpose of Visit
            <select value={form.purpose} onChange={e => update("purpose", e.target.value)}>
              <option value="tourism">Tourism</option>
              <option value="business">Business</option>
              <option value="medical treatment">Medical treatment</option>
              <option value="visiting family/friends">Visiting family/friends</option>
              <option value="other">Other</option>
            </select>
          </label>

          {form.purpose === "other" && (
            <label>
              Specify purpose
              <input value={form.purposeOther} onChange={e => update("purposeOther", e.target.value)} placeholder="Purpose of visit" />
            </label>
          )}

          <div className="grid">
            <label>
              Arrival Date
              <input type="date" value={form.arrivalDate} onChange={e => update("arrivalDate", e.target.value)} />
            </label>
            <label>
              Departure Date
              <input type="date" value={form.departureDate} onChange={e => update("departureDate", e.target.value)} />
            </label>
          </div>

          <div className="duration">
            <span>Total stay</span>
            <strong>{days ? `${days} days` : "Enter valid dates"}</strong>
          </div>

          <label>
            Country you will return to
            <input value={form.returnCountry} onChange={e => update("returnCountry", e.target.value)} placeholder="e.g. Bangladesh" />
          </label>

          <h2>Signature</h2>

          <div>
            <label>
              Date
              <input type="date" value={form.signedDate} onChange={e => update("signedDate", e.target.value)} />
            </label>
          </div>

          <div className="actions">
            <button className="secondary" onClick={reset}>Reset</button>
            <button className="primary" onClick={generatePDF}>Download PDF</button>
          </div>
        </section>

        <section className="card preview-card">
          <div className="preview-heading">
            <h2>Preview</h2>
            <span>A4</span>
          </div>

          <div className="paper">
            <h3>VISA UNDERTAKING FORM</h3>
            <p>I, the undersigned, hereby submit this undertaking in support of my application for an Indian visa.</p>

            <h4>1. Personal Details</h4>
            <p>Full Name: <b>{form.fullName || " "}</b></p>
            <p>Passport Number: <b>{form.passportNumber || " "}</b></p>
            <p>Nationality: <b>{form.nationality || " "}</b></p>
            <p>Date of Birth: <b>{formatDate(form.dateOfBirth)}</b></p>
            <p>Address: <b>{form.address || " "}</b></p>

            <h4>2. Purpose of Visit</h4>
            <p>I wish to visit India for the purpose of <b>{purposeText}</b>.</p>

            <h4>3. Duration of Stay</h4>
            <p>I intend to stay in India from <b>{formatDate(form.arrivalDate)}</b> to <b>{formatDate(form.departureDate)}</b>, for a total period of <b>{days || "____"}</b> days.</p>

            <h4>4. Return to Home Country</h4>
            <p>I undertake to return to my home country immediately upon the completion of my visit, and I confirm that I have no intention of overstaying my visa in India. I will return to <b>{form.returnCountry || "________________"}</b>.</p>

            <h4>5. Compliance with Indian Laws</h4>
            <p>I hereby pledge to fully comply with the laws, regulations, and customs of India during my stay. I acknowledge that I will not engage in any activity that is prohibited under Indian law and will respect the local customs and culture.</p>

            <h4>6. Acknowledgment and Declaration</h4>
            <p>I understand that any violation of Indian laws or regulations may lead to the cancellation of my visa and may affect my future eligibility for a visa to India.</p>
            <p>I declare that all information provided in my visa application is accurate and truthful to the best of my knowledge. I understand that providing false or misleading information may result in the denial of my visa application.</p>
            <p>I undertake to adhere to all the terms and conditions of my visa and will ensure that I leave India before the expiration of my authorized stay.</p>

            <div className="signature-preview">
              <p><b>Signature of Applicant:</b> {form.signatureName || " "}</p>
              <p><b>Date:</b> {formatDate(form.signedDate)}</p>
            </div>
          </div>
        </section>
      </main>

      <footer className="app-footer">
        <div className="privacy-notice">
          <div className="privacy-icon">🔒</div>

          <div className="privacy-content">
            <h3>Your privacy matters</h3>

            <p>
              Your information stays private. The PDF is generated locally in your
              browser, and no form data is sent to or stored on a server.
            </p>

            <p>
              <strong>Don't want to share your personal information?</strong>
              <br />
              Simply click the <strong>Download PDF</strong> button to get a blank
              copy of the form and fill it in manually.
            </p>
          </div>
        </div>

        <div className="footer-credit">
          Made with <span>♥</span> by <strong>Kapil</strong>
        </div>
      </footer>
    </div>
  );
}

const measurementId = import.meta.env.VITE_GA_MEASUREMENT_ID;

if (measurementId) {
  ReactGA.initialize(measurementId);
}

createRoot(document.getElementById("root")).render(
  <>
    <App />
    <SpeedInsights />
  </>
);
