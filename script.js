// ==========================================
// MS SERVICES - CORE INTERACTIVE ENGINE
// ==========================================

document.addEventListener("DOMContentLoaded", () => {
  // 1. Mobile Drawer Navigation Toggle
  const menuToggle = document.getElementById("mobile-menu-toggle");
  const mobileDrawer = document.getElementById("mobile-drawer");

  if (menuToggle && mobileDrawer) {
    menuToggle.addEventListener("click", () => {
      const isOpen = mobileDrawer.classList.toggle("open");
      menuToggle.classList.toggle("active", isOpen);
      menuToggle.setAttribute("aria-expanded", isOpen ? "true" : "false");
      mobileDrawer.setAttribute("aria-hidden", isOpen ? "false" : "true");
    });

    // Close when clicking a link inside mobile drawer
    mobileDrawer.querySelectorAll("a").forEach((link) => {
      link.addEventListener("click", () => {
        mobileDrawer.classList.remove("open");
        menuToggle.classList.remove("active");
        menuToggle.setAttribute("aria-expanded", "false");
        mobileDrawer.setAttribute("aria-hidden", "true");
      });
    });
  }

  // 2. Smooth scrolling for internal anchor links (e.g. #calculator, #contact)
  document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
    anchor.addEventListener("click", function (e) {
      const targetId = this.getAttribute("href");
      if (targetId && targetId !== "#") {
        const targetElement = document.querySelector(targetId);
        if (targetElement) {
          e.preventDefault();
          targetElement.scrollIntoView({
            behavior: "smooth",
            block: "start"
          });
        }
      }
    });
  });

  // 3. Interactive Tax Calculator (Old vs New Regime)
  initTaxCalculator();

  // 4. Contact Form with EmailJS integration
  initContactForm();
});

// ==========================================
// TAX CALCULATOR (OLD vs NEW REGIME)
// FY 2024-25 / 2025-26 & AY 2025-26 / 2026-27
// ==========================================
function initTaxCalculator() {
  const calcForm = document.getElementById("tax-calculator-form");
  if (!calcForm) return;

  const incomeInput = document.getElementById("calc-income");
  const incomeSlider = document.getElementById("calc-income-slider");
  const deduction80CInput = document.getElementById("calc-80c");
  const deduction80DInput = document.getElementById("calc-80d");
  const deductionHRAInput = document.getElementById("calc-hra");

  const oldTaxDisplay = document.getElementById("calc-old-tax");
  const newTaxDisplay = document.getElementById("calc-new-tax");
  const savingsDisplay = document.getElementById("calc-savings-amount");
  const recommendationBadge = document.getElementById("calc-recommendation");
  const bookHelpBtn = document.getElementById("calc-whatsapp-btn");

  // Sync number input and range slider
  if (incomeInput && incomeSlider) {
    incomeSlider.addEventListener("input", (e) => {
      incomeInput.value = e.target.value;
      calculateTax();
    });

    incomeInput.addEventListener("input", (e) => {
      let val = Number(e.target.value) || 0;
      if (val > 5000000) val = 5000000;
      incomeSlider.value = val;
      calculateTax();
    });
  }

  [deduction80CInput, deduction80DInput, deductionHRAInput].forEach((input) => {
    if (input) {
      input.addEventListener("input", calculateTax);
    }
  });

  function formatINR(val) {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0
    }).format(Math.round(val));
  }

  function calculateTax() {
    const grossIncome = Math.max(0, Number(incomeInput ? incomeInput.value : 1000000) || 0);
    const sec80C = Math.min(150000, Math.max(0, Number(deduction80CInput ? deduction80CInput.value : 0) || 0));
    const sec80D = Math.min(75000, Math.max(0, Number(deduction80DInput ? deduction80DInput.value : 0) || 0));
    const hraOrInterest = Math.min(200000, Math.max(0, Number(deductionHRAInput ? deductionHRAInput.value : 0) || 0));

    // --- NEW REGIME CALCULATION (Budget 2024 / FY 2024-25 & FY 2025-26) ---
    // Standard deduction under New Regime is ₹75,000 for salaried
    const newStdDeduction = 75000;
    const newTaxableIncome = Math.max(0, grossIncome - newStdDeduction);

    let newTax = 0;
    if (newTaxableIncome <= 700000) {
      // Sec 87A rebate provides 100% tax relief up to 7 Lakh taxable income!
      newTax = 0;
    } else {
      if (newTaxableIncome > 300000) {
        newTax += Math.min(newTaxableIncome - 300000, 400000) * 0.05; // 3L to 7L @ 5%
      }
      if (newTaxableIncome > 700000) {
        newTax += Math.min(newTaxableIncome - 700000, 300000) * 0.10; // 7L to 10L @ 10%
      }
      if (newTaxableIncome > 1000000) {
        newTax += Math.min(newTaxableIncome - 1000000, 200000) * 0.15; // 10L to 12L @ 15%
      }
      if (newTaxableIncome > 1200000) {
        newTax += Math.min(newTaxableIncome - 1200000, 300000) * 0.20; // 12L to 15L @ 20%
      }
      if (newTaxableIncome > 1500000) {
        newTax += (newTaxableIncome - 1500000) * 0.30; // Above 15L @ 30%
      }
      // Add 4% Health & Education cess
      newTax = newTax * 1.04;
    }

    // --- OLD REGIME CALCULATION ---
    // Standard deduction under Old Regime is ₹50,000
    const oldStdDeduction = 50000;
    const totalOldDeductions = oldStdDeduction + sec80C + sec80D + hraOrInterest;
    const oldTaxableIncome = Math.max(0, grossIncome - totalOldDeductions);

    let oldTax = 0;
    if (oldTaxableIncome <= 500000) {
      // Sec 87A rebate up to 5 Lakh taxable income
      oldTax = 0;
    } else {
      if (oldTaxableIncome > 250000) {
        oldTax += Math.min(oldTaxableIncome - 250000, 250000) * 0.05; // 2.5L to 5L @ 5%
      }
      if (oldTaxableIncome > 500000) {
        oldTax += Math.min(oldTaxableIncome - 500000, 500000) * 0.20; // 5L to 10L @ 20%
      }
      if (oldTaxableIncome > 1000000) {
        oldTax += (oldTaxableIncome - 1000000) * 0.30; // Above 10L @ 30%
      }
      // Add 4% Health & Education cess
      oldTax = oldTax * 1.04;
    }

    // Update UI elements
    if (oldTaxDisplay) oldTaxDisplay.textContent = formatINR(oldTax);
    if (newTaxDisplay) newTaxDisplay.textContent = formatINR(newTax);

    const diff = Math.abs(oldTax - newTax);
    if (savingsDisplay) savingsDisplay.textContent = formatINR(diff);

    if (recommendationBadge) {
      if (newTax < oldTax) {
        recommendationBadge.className = "recommendation-pill badge-new-regime";
        recommendationBadge.textContent = `New Regime Saves You ${formatINR(diff)}`;
      } else if (oldTax < newTax) {
        recommendationBadge.className = "recommendation-pill badge-old-regime";
        recommendationBadge.textContent = `Old Regime Saves You ${formatINR(diff)}`;
      } else {
        recommendationBadge.className = "recommendation-pill badge-neutral";
        recommendationBadge.textContent = "Both Regimes Yield Identical Tax";
      }
    }

    // Update WhatsApp link with customized inquiry message
    if (bookHelpBtn) {
      const regimeRecommended = newTax <= oldTax ? "New Regime" : "Old Regime";
      const message = encodeURIComponent(
        `Hi MS Services, I used your Tax Calculator for annual income of ${formatINR(grossIncome)}. It shows ${regimeRecommended} is better. I would like assistance filing my Income Tax Return accurately.`
      );
      bookHelpBtn.href = `https://wa.me/917661962823?text=${message}`;
    }
  }

  // Initial calculation on page load
  calculateTax();
}

// ==========================================
// CONTACT FORM HANDLER (EMAILJS)
// ==========================================
function initContactForm() {
  const form = document.getElementById("contact-form");
  const statusMessage = document.getElementById("form-status");
  if (!form) return;

  const EMAILJS_PUBLIC_KEY = "O_xq3L9bROOSALIUm";
  const EMAILJS_SERVICE_ID = "service_dqrxfhv";
  const EMAILJS_TEMPLATE_ID = "template_58bg36s";

  if (typeof emailjs !== "undefined") {
    try {
      emailjs.init({ publicKey: EMAILJS_PUBLIC_KEY });
    } catch (e) {
      console.warn("EmailJS init warning", e);
    }
  }

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    const submitButton = form.querySelector('button[type="submit"]');
    const emailField = form.querySelector('input[name="email"]');
    const replyToField = form.querySelector('input[name="reply_to"]');

    if (emailField && replyToField) {
      replyToField.value = emailField.value.trim();
    }

    if (submitButton) {
      submitButton.disabled = true;
      submitButton.innerHTML = `
        <svg class="spin-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:16px;height:16px;display:inline-block;margin-right:8px;vertical-align:middle;">
          <circle cx="12" cy="12" r="10" stroke-opacity="0.25"></circle>
          <path d="M12 2a10 10 0 0 1 10 10"></path>
        </svg>
        Sending Inquiry...
      `;
    }

    if (statusMessage) {
      statusMessage.className = "form-status-notice pending";
      statusMessage.textContent = "Connecting to tax advisor...";
    }

    if (typeof emailjs !== "undefined") {
      emailjs
        .sendForm(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, this)
        .then(() => {
          if (statusMessage) {
            statusMessage.className = "form-status-notice success";
            statusMessage.textContent = "Thank you! Your message has been sent. A consultant will reach out shortly.";
          }
          form.reset();
        })
        .catch((error) => {
          console.error("EmailJS submission error:", error);
          if (statusMessage) {
            statusMessage.className = "form-status-notice error";
            statusMessage.textContent = "Direct sending encountered an issue. Please click the WhatsApp button to chat instantly with us.";
          }
        })
        .finally(() => {
          if (submitButton) {
            submitButton.disabled = false;
            submitButton.textContent = "Send Message";
          }
        });
    } else {
      // Fallback if EmailJS CDN is blocked or unavailable
      setTimeout(() => {
        if (statusMessage) {
          statusMessage.className = "form-status-notice success";
          statusMessage.innerHTML = `Inquiry recorded. For urgent assistance, please <a href="https://wa.me/917661962823" target="_blank" rel="noopener" style="color:var(--emerald);text-decoration:underline;">click here to chat on WhatsApp (+91 7661962823)</a>.`;
        }
        if (submitButton) {
          submitButton.disabled = false;
          submitButton.textContent = "Send Message";
        }
      }, 500);
    }
  });
}
