import Image from "next/image";
import { img } from "./assets";

const storyCards = [
  {
    title: "Individual Therapy",
    text: "A steady space to understand what hurts, rebuild trust with yourself, and move with more ease.",
    image: "b35c3bb1-i3wLiFEx85bL9zj8Y2GBkjDc5z4.avif",
  },
  {
    title: "Life Coaching",
    text: "Focused guidance for decisions, momentum, and practical change that fits your actual life.",
    image: "49644c2b-PSjitKcEoMQOEmVvStpNCNRXmSk.avif",
  },
  {
    title: "Mindfulness Support",
    text: "Simple practices for slowing down, noticing your patterns, and making room to breathe.",
    image: "dfbe3929-lZn0EEipDdK6TqFQ685W86d6r9M.avif",
  },
  {
    title: "Clarity Session",
    text: "A one-time conversation when you need direction, reflection, or a place to begin.",
    image: "673c0ab4-VW2dIv9jFcnOEMXK68HcTW0X9g.avif",
  },
];

const steps = [
  ["01", "Reach Out", "Start with a short introductory call. We'll talk through what brings you here and how we might support you. You can share as much or as little as you're comfortable with, and we'll listen without judgment."],
  ["02", "Define Direction", "Together, we'll shape a path around your needs and pace. Whether it's emotional clarity, life transitions, or stronger daily rhythms, each session gives you room to notice what's changing."],
  ["03", "Stay Supported", "Progress keeps building through steady reflection and practical tools. You'll leave with small steps that fit into real life, plus support that helps you keep moving when things feel uncertain."],
];

export function StoryProcess() {
  return (
    <>
      <section id="work" className="section intro">
        <p className="eyebrow" data-reveal>balance</p>
        <h2 data-reveal>There may not be a single switch, <span>but there are clear steps forward.</span></h2>
        <div className="cards">
          {storyCards.map((card) => (
            <article className="story-card" key={card.title} data-reveal>
              <Image src={img(card.image)} alt="" fill sizes="25vw" />
              <div>
                <h3>{card.title}</h3>
                <p>{card.text}</p>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section id="stories" className="split section">
        <div className="split-copy" data-reveal>
          <p className="eyebrow">real people. real change.</p>
          <h2>Finding balance after burnout.</h2>
          <p>After years of chronic stress and emotional fatigue, Maya reached out during a low point. Through small, consistent steps, she rediscovered stability and reconnected with her creative energy.</p>
          <a href="#">read full story</a>
        </div>
        <div className="overlap" data-parallax>
          <Image src={img("781cccd9-lLxmvlvWIZ4P7PBI7azU4zec.avif")} alt="" width={460} height={520} loading="eager" unoptimized />
          <Image src={img("761bbe39-Xgg8qSDKhoEnATJuF3xxVuO0bw.avif")} alt="" width={380} height={520} loading="eager" unoptimized />
        </div>
      </section>

      <section className="process section">
        <h2 data-reveal>How <span>It Works</span></h2>
        <p className="kicker" data-reveal>Getting started doesn't have to be complicated. Our process is simple, supportive, and designed to move at a pace that feels right for you - from the first hello to the progress you'll see over time.</p>
        <div className="steps">
          {steps.map(([number, title, text]) => (
            <article key={number} data-reveal>
              <span>{number}</span>
              <h3>{title}</h3>
              <p>{text}</p>
            </article>
          ))}
        </div>
      </section>
    </>
  );
}
