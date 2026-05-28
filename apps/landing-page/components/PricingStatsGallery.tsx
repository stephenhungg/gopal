import Image from "next/image";
import { img } from "./assets";

const prices = [
  {
    name: "Starter",
    price: "$49",
    text: "Explore therapy at your own pace.",
    features: ["Dedicated therapist", "Online or in-person", "Personalized goal-setting", "Client portal access"],
  },
  {
    name: "Growth",
    price: "$89",
    text: "Ongoing support for continued growth.",
    features: ["Everything in Starter", "More flexible scheduling", "Progress tracking", "Extra resources"],
  },
  {
    name: "Complete",
    price: "$229",
    text: "Consistent support with full access.",
    features: ["All Growth features", "Extended sessions", "Priority booking", "Direct therapist messaging"],
  },
];

const stats = [
  ["450+", "Therapy sessions completed"],
  ["80+", "Clients supported"],
  ["9+", "Years of professional experience"],
  ["25+", "Programs and tools offered"],
];

export function PricingStatsGallery() {
  return (
    <>
      <section className="image-break">
        <Image src={img("b35c3bb1-i3wLiFEx85bL9zj8Y2GBkjDc5z4.avif")} alt="" fill loading="eager" unoptimized data-parallax />
      </section>

      <section className="pricing section">
        <div className="pricing-intro" data-reveal>
          <span className="wave-mark" aria-hidden="true">~~~</span>
          <p className="eyebrow">our prices</p>
          <h2>Support that fits your pace.</h2>
          <p>A first session is often just a conversation, a starting point. From there, you choose the pace and depth of support that feels right for you.</p>
          <div className="billing-toggle" aria-label="billing period">
            <span>monthly</span>
            <span className="toggle-track"><span /></span>
            <span>yearly <em>(20% off)</em></span>
          </div>
        </div>
        <div className="price-grid">
          {prices.map(({ name, price, text, features }) => (
            <article key={name} data-reveal>
              <h3>{name}</h3>
              <strong>{price}</strong>
              <span className="per-month">/ month</span>
              <p>{text}</p>
              <ul>
                {features.map((feature) => (
                  <li key={feature}>{feature}</li>
                ))}
              </ul>
              <a href="#book">get started</a>
            </article>
          ))}
        </div>
        <div className="pricing-note" data-reveal>
          <h2>Support grounded in experience, guided by clarity, and <span>built for lasting change</span></h2>
          <p>Our sessions create space for that change to happen. We take time to understand your needs, offer structure where it helps, and support your direction, not ours. Learn more about <a href="#book">how we work</a> and what happens from the process.</p>
        </div>
      </section>

      <section className="gallery section">
        <article data-reveal>
          <Image src={img("375faa5c-yzTuL74LYLey46xO4X9rihvGRs4.avif")} alt="" fill loading="eager" unoptimized />
          <div>
            <span>story</span>
            <h3>Finding balance after burnout</h3>
          </div>
        </article>
        <article data-reveal>
          <Image src={img("f394963e-X1KAS3BPHbN4rR5FN8CCVsSUhM.avif")} alt="" fill loading="eager" unoptimized />
          <div>
            <span>journal</span>
            <h3>Learning to pause without guilt</h3>
          </div>
        </article>
        <article data-reveal>
          <Image src={img("112ee9d4-D6H1lHKBDuxkhpUVf8PPyt7Jivg.avif")} alt="" fill loading="eager" unoptimized />
          <div>
            <span>guide</span>
            <h3>Small practices for calmer weeks</h3>
          </div>
        </article>
      </section>

      <section className="stats section">
        {stats.map(([number, label]) => (
          <div key={label} data-reveal>
            <strong>{number}</strong>
            <span>{label}</span>
          </div>
        ))}
      </section>
    </>
  );
}
