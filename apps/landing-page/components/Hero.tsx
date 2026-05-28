import Image from "next/image";
import { img } from "./assets";

export function Hero() {
  return (
    <section className="hero">
      <Image
        src={img("0e342e43-vJzjZEQ7XEcIpUiaWAlM8HVcE.avif")}
        alt=""
        fill
        priority
        className="hero-img"
      />
      <div className="grain" />
      <nav className="nav">
        <a className="brand" href="#" aria-label="clear path home">
          <span aria-hidden="true" />
          clear-path
        </a>
        <div className="nav-links">
          <a href="#about">about</a>
          <a href="#work">services</a>
          <a href="#stories">stories</a>
          <a href="#journal">journal</a>
        </div>
        <a className="pill nav-cta" href="#book">book a session</a>
      </nav>
      <div className="hero-copy">
        <h1>
          <span data-hero-line>A Path That</span>
          <span data-hero-line>Shapes Your</span>
          <span data-hero-line>Future.</span>
        </h1>
        <div className="hero-panel" data-reveal>
          <p>
            We offer therapy and coaching to help you navigate life's challenges with
            confidence and care. Together, we'll build personal insight, emotional
            well-being, and the steps needed for lasting change at your own pace.
          </p>
          <a className="pill light" href="#book">start your journey</a>
        </div>
      </div>
    </section>
  );
}
