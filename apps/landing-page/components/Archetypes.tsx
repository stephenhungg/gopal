import Image from "next/image";
import { Reveal } from "./Reveal";
import { MaskedLine } from "./MaskedLine";
import { TiltedCard } from "./TiltedCard";
import { SparkleField } from "./SparkleField";
import { CuteAccent } from "./CuteAccent";
import { TransitionLink } from "./PageTransition";

// reference cluster centers from PERSONA.md — these are NOT a 4-option pick.
// the swipe converges on a 768d persona vector across aesthetic × disposition
// × style — millions of points in a continuous space. these 4 are example
// anchors so the visitor has something to imagine; the actual she is between.

const archetypes = [
  { title: "sniffs", meta: "vision · room context", asset: "/gopal/gopal-orb-icon.png", body: "notices the scene changed and has to comment. objects, motion, people walking in — all fair game." },
  { title: "yaps", meta: "voice · realtime", asset: "/gopal/goblin-wave.png", body: "talks like a creature in the headset instead of a customer support bot. quick, interruptible, weird." },
  { title: "lurks", meta: "spatial · presence", asset: "/gopal/gopal-hero-room.png", body: "sits in the room as a tiny embodied bit, waiting for the next excuse to react." },
  { title: "schemes", meta: "demo · hack night", asset: "/gopal/goblin-desk.png", body: "thin fastapi backend, realtime session, vision pro front end. all the complexity goes into the moment." },
];

export function Archetypes() {
  return (
    <section
      id="archetypes"
      className="relative overflow-hidden"
      style={{
        backgroundImage:
          "repeating-linear-gradient(0deg, var(--soft) 0 32px, var(--cloud) 32px 64px)",
      }}
    >
      <SparkleField variant="ambient" density={32} />
      <CuteAccent kind="bow"        size={140} rotate={-12} top="80px"   right="6%" opacity={0.95} />
      <CuteAccent kind="strawberry" size={110} rotate={18}  top="40%"    left="3%"  opacity={0.9} />
      <CuteAccent kind="cloud"      size={170} rotate={-6}  bottom="18%" right="4%" opacity={0.85} />
      <CuteAccent kind="donut"      size={120} rotate={20}  bottom="40%" left="6%"  opacity={0.9} />
      <CuteAccent kind="crystal"    size={100} rotate={-14} top="25%"    right="14%" opacity={0.85} />

      <div className="gutter relative pt-[140px] pb-[120px] tablet:pt-[180px]">
        <MaskedLine duration={1} ease="expo.out">
          <h2 className="m-0 max-w-[820px] font-bagel text-[44px] font-normal leading-[1.05] tracking-[-0.01em] text-ink-near tablet:text-[64px] desktop:text-[80px]">
            not angel modes. gopal modes.
          </h2>
        </MaskedLine>
        <Reveal delay={0.2} className="mt-6 max-w-[680px]">
          <p className="font-sans text-[16px] leading-[1.6] text-muted-deep tablet:text-[18px]">
            the old swipe stuff is gone. these are the only beats that matter
            for the hack night demo: see, hear, react, and be unmistakably
            gopal.
          </p>
        </Reveal>

        <ul className="mt-16 grid grid-cols-1 gap-10 tablet:grid-cols-2 tablet:gap-12">
          {archetypes.map((a, i) => (
            <Reveal as="li" key={a.title} delay={i * 0.08}>
              <article className="flex flex-col items-start gap-5">
                <div className="relative aspect-square w-full max-w-[560px]">
                  <TiltedCard
                    rotateAmplitude={9}
                    scaleOnHover={1.03}
                    showTooltip
                    captionText={a.title}
                    className="h-full w-full"
                  >
                    <Image
                      src={a.asset}
                      alt={a.title}
                      width={1024}
                      height={1024}
                      className="h-full w-full select-none object-contain"
                      style={{ transform: "translateZ(0)" }}
                    />
                  </TiltedCard>
                </div>
                <div className="flex w-full items-baseline justify-between gap-4 px-1">
                  <h3 className="font-bagel text-[28px] font-normal leading-tight tracking-[-0.005em] text-ink-near tablet:text-[36px]">
                    {a.title}
                  </h3>
                  <span className="font-sans text-[12px] text-muted-secondary">{a.meta}</span>
                </div>
                <p className="px-1 font-sans text-[15px] leading-[1.6] text-muted-deep">{a.body}</p>
              </article>
            </Reveal>
          ))}
        </ul>

        <Reveal delay={0.3} className="mt-16 tablet:mt-20">
          <TransitionLink
            href="/download"
            className="group inline-flex items-baseline gap-3 font-sans text-[20px] font-medium tracking-[-0.005em] text-ink-near transition-colors duration-200 ease-linear hover:text-sakura-600"
          >
            <span>wake gopal</span>
            <span className="transition-transform duration-200 ease-linear group-hover:translate-x-1">→</span>
          </TransitionLink>
        </Reveal>
      </div>
    </section>
  );
}
