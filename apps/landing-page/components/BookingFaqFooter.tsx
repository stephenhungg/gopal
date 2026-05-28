const faqs = [
  ["How do I know if therapy is right for me?", "Therapy isn't just for crises. It's for anyone curious about growth, clarity, or navigating life's changes with more support and self-awareness."],
  ["What can I expect from the first session?", "The first session is a gentle starting point. You'll talk with your therapist about what brings you here, what you're hoping for, and what feels comfortable for you right now."],
  ["Do you offer both online and in-person sessions?", "Yes. Whether you prefer meeting face-to-face or from the comfort of home, we offer flexible options to meet you where you are."],
  ["How often should I come to therapy?", "Some people come weekly, others bi-weekly or monthly. Together we find the pace that supports your goals and your life."],
  ["Is everything I share kept private?", "Your privacy matters. We handle your information with care and talk through confidentiality clearly before you begin."],
];

export function BookingFaqFooter() {
  return (
    <>
      <section className="faq section">
        <div data-reveal>
          <h2>Your questions.<br /><span>Answered.</span></h2>
          <p>Not sure what to expect? These answers might help you feel more confident as you begin.</p>
          <div className="faq-cta">
            <p>Didn't find your answer? Send us a message, we'll respond with care and clarity.</p>
            <a href="#book">about clearpath</a>
          </div>
        </div>
        <div className="faq-list">
          {faqs.map(([question, answer], index) => (
            <details key={question} open={index === 0} data-reveal>
              <summary>{question}</summary>
              <p>{answer}</p>
            </details>
          ))}
        </div>
      </section>

      <section id="book" className="booking section">
        <div className="booking-copy" data-reveal>
          <p className="eyebrow">book a session</p>
          <h2>Support starts with <span>a simple step.</span></h2>
          <p>Whether you're starting fresh, returning for ongoing support, or simply exploring your options, we're here to meet you where you are. Use the form to book a session that feels right for you.</p>
          <div className="booking-proof">
            <p>Trusted by 80+ clients</p>
            <div className="avatar-row" aria-hidden="true">
              <span /><span /><span /><span /><span /><strong>+81</strong>
            </div>
            <strong>Excellent 4.9 out of 5 <span>*</span> TrustPoint</strong>
          </div>
          <p className="contact-line">Prefer to chat first? <a href="mailto:hello@clearpath.com">Send us an email</a> or connect with us on social, we're always happy to help.</p>
        </div>
        <form data-reveal>
          <h3>Tell us about you.</h3>
          <label><input placeholder="Your Name *" /></label>
          <label><input type="email" placeholder="Your Email *" /></label>
          <label><input type="tel" placeholder="Phone Number" /></label>
          <label>
            <select defaultValue="">
              <option value="" disabled>Preferred Pronouns *</option>
              <option>she/her</option>
              <option>he/him</option>
              <option>they/them</option>
              <option>prefer to share later</option>
            </select>
          </label>
          <h3>How can we help?</h3>
          <label><textarea placeholder="Feel free to share anything that helps us understand your needs" /></label>
          <fieldset>
            <legend>What kind of support are you looking for?</legend>
            {["Individual Therapy", "Life Coaching", "Stress & Mindfulness Support", "Clarity Session / One-Time Consult", "Not sure yet, just exploring"].map((item) => (
              <label key={item} className="check-row"><input type="checkbox" />{item}</label>
            ))}
          </fieldset>
          <label>
            <select defaultValue="">
              <option value="" disabled>Where did you hear about us? *</option>
              <option>search</option>
              <option>friend or referral</option>
              <option>social media</option>
              <option>other</option>
            </select>
          </label>
          <label className="check-row"><input type="checkbox" />Would you like to receive updates via email?</label>
          <p>We send an email newsletter once a month, which includes tips, articles, offers and news. Our emails always contain an unsubscribe link.</p>
          <button type="button">book a session</button>
        </form>
      </section>

      <footer>
        <div className="footer-newsletter">
          <a href="#">clear-path</a>
          <h2>Join Our Newsletter.</h2>
          <p>We share occasional insights on personal growth, emotional well-being, and practical tools to navigate life with more clarity and balance.</p>
          <form>
            <input type="email" placeholder="Your Email" />
            <button type="button">subscribe</button>
          </form>
          <small>By signing up to receive emails from ClearPath, you agree to our <strong>Privacy Policy.</strong></small>
          <p>Contact us: <a href="mailto:hello@clearpath.com">hello@clearpath.com</a></p>
        </div>
        <nav aria-label="sitemap">
          <span>sitemap</span>
          {["Main Page", "Article", "About", "Book a Session", "Services", "Privacy Policy", "Stories", "Terms of Use", "Client Story", "404", "Journal"].map((item) => (
            <a href="#" key={item}>{item}</a>
          ))}
        </nav>
        <div className="footer-meta">
          <p>Framer Template<br />handcrafted by Anton Drukarov</p>
          <p>Copyright 2026 ClearPath. All rights reserved.</p>
        </div>
      </footer>
    </>
  );
}
