"use client";

import { motion } from "framer-motion";
import {
  Camera,
  MapPin,
  Search,
  Shield,
  Smartphone,
  BarChart3,
  ArrowRight,
  CheckCircle2,
  Car,
  Users,
  Building2,
} from "lucide-react";
import { AuroraBackdrop } from "@/components/aurora/aurora-backdrop";

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] as const },
  },
};

const stagger = {
  visible: { transition: { staggerChildren: 0.1 } },
};

const features = [
  {
    icon: Camera,
    title: "Photo Documentation",
    description:
      "Capture timestamped photos of every vehicle at intake, movement, and delivery. Full visual audit trail.",
  },
  {
    icon: MapPin,
    title: "Multi-Location Tracking",
    description:
      "Manage multiple parking areas, overflow lots, and service bays across your entire dealership footprint.",
  },
  {
    icon: Search,
    title: "Instant Vehicle Search",
    description:
      "Find any vehicle in seconds by VIN, stock number, make, model, or color. Never lose a car again.",
  },
  {
    icon: Shield,
    title: "Condition Reporting",
    description:
      "Document vehicle condition with photos and notes at every handoff. Protect against damage claims.",
  },
  {
    icon: Smartphone,
    title: "Mobile-First Design",
    description:
      "Purpose-built iOS app for lot attendants. Scan, snap, park, and move vehicles from the palm of your hand.",
  },
  {
    icon: BarChart3,
    title: "Real-Time Dashboard",
    description:
      "Live occupancy rates, vehicle counts, and activity feeds. Your management team sees everything at a glance.",
  },
];

const steps = [
  {
    number: "01",
    title: "Sign Up Your Dealership",
    description:
      "Create your account and configure your locations, parking areas, and capacity in minutes.",
    icon: Building2,
  },
  {
    number: "02",
    title: "Add Your Team",
    description:
      "Invite lot attendants, valets, and managers. Each role gets the right level of access.",
    icon: Users,
  },
  {
    number: "03",
    title: "Start Tracking Vehicles",
    description:
      "Your team photographs and logs every vehicle as it arrives, moves, or leaves. Full visibility from day one.",
    icon: Car,
  },
];

const stats = [
  { value: "100%", label: "Vehicle Visibility" },
  { value: "<30s", label: "Vehicle Lookup Time" },
  { value: "24/7", label: "Real-Time Tracking" },
  { value: "Zero", label: "Lost Vehicles" },
];

export default function MarketingHomePage() {
  return (
    <>
      {/* Hero */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        <AuroraBackdrop />

        <div className="relative z-10 mx-auto max-w-7xl px-6 pt-32 pb-20 lg:px-8 text-center">
          <motion.div
            variants={stagger}
            initial="hidden"
            animate="visible"
            className="mx-auto max-w-4xl"
          >
            <motion.div variants={fadeUp} className="mb-6">
              <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-caption text-white/60 backdrop-blur">
                <span className="h-1.5 w-1.5 rounded-full bg-brand-500 animate-pulse" />
                Now available on the App Store
              </span>
            </motion.div>

            <motion.h1
              variants={fadeUp}
              className="text-4xl sm:text-5xl lg:text-7xl font-semibold tracking-tight leading-[1.1]"
            >
              Know where every{" "}
              <span className="text-brand-500">vehicle</span> is.{" "}
              <span className="text-white/40">Always.</span>
            </motion.h1>

            <motion.p
              variants={fadeUp}
              className="mt-6 text-lg sm:text-xl text-white/50 max-w-2xl mx-auto leading-relaxed"
            >
              SmartLots Pro gives automotive dealerships real-time vehicle
              tracking, photo documentation, and multi-location parking
              management — all from a single mobile app.
            </motion.p>

            <motion.div
              variants={fadeUp}
              className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4"
            >
              <a
                href="#contact"
                className="group flex items-center gap-2 rounded-xl bg-brand-500 px-6 py-3.5 text-body font-medium text-white hover:bg-brand-600 transition-all hover:shadow-[0_0_30px_0_rgba(238,63,67,0.3)]"
              >
                Request a Demo
                <ArrowRight
                  size={16}
                  className="group-hover:translate-x-0.5 transition-transform"
                />
              </a>
              <a
                href="https://admin.smartlotpro.com/login"
                className="flex items-center gap-2 rounded-xl border border-white/15 bg-white/5 px-6 py-3.5 text-body font-medium text-white/80 hover:bg-white/10 hover:text-white transition-all backdrop-blur"
              >
                Sign In to Portal
              </a>
            </motion.div>
          </motion.div>

          {/* Stats bar */}
          <motion.div
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="mt-24 mx-auto max-w-3xl grid grid-cols-2 sm:grid-cols-4 gap-8"
          >
            {stats.map((stat) => (
              <div key={stat.label} className="text-center">
                <p className="text-display-sm text-white">{stat.value}</p>
                <p className="mt-1 text-caption text-white/40">{stat.label}</p>
              </div>
            ))}
          </motion.div>
        </div>

        {/* Bottom gradient fade */}
        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-[#080808] to-transparent" />
      </section>

      {/* Features */}
      <section id="features" className="relative py-24 lg:py-32">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <motion.div
            variants={stagger}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            className="text-center mb-16"
          >
            <motion.p
              variants={fadeUp}
              className="text-overline text-brand-500 mb-3"
            >
              Features
            </motion.p>
            <motion.h2
              variants={fadeUp}
              className="text-3xl sm:text-4xl font-semibold tracking-tight"
            >
              Everything your lot team needs
            </motion.h2>
            <motion.p
              variants={fadeUp}
              className="mt-4 text-lg text-white/40 max-w-2xl mx-auto"
            >
              From intake to delivery, SmartLots Pro handles the entire vehicle
              lifecycle across your dealership.
            </motion.p>
          </motion.div>

          <motion.div
            variants={stagger}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-50px" }}
            className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3"
          >
            {features.map((feature) => (
              <motion.div
                key={feature.title}
                variants={fadeUp}
                className="group relative rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6 hover:bg-white/[0.04] hover:border-white/10 transition-all duration-300"
              >
                <div className="mb-4 inline-flex rounded-xl bg-brand-500/10 p-2.5 text-brand-500">
                  <feature.icon size={22} strokeWidth={1.5} />
                </div>
                <h3 className="text-heading-3 text-white mb-2">
                  {feature.title}
                </h3>
                <p className="text-body-sm text-white/40 leading-relaxed">
                  {feature.description}
                </p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* How It Works */}
      <section
        id="how-it-works"
        className="relative py-24 lg:py-32 border-t border-white/[0.06]"
      >
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <motion.div
            variants={stagger}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            className="text-center mb-16"
          >
            <motion.p
              variants={fadeUp}
              className="text-overline text-brand-500 mb-3"
            >
              How It Works
            </motion.p>
            <motion.h2
              variants={fadeUp}
              className="text-3xl sm:text-4xl font-semibold tracking-tight"
            >
              Up and running in minutes
            </motion.h2>
          </motion.div>

          <motion.div
            variants={stagger}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-50px" }}
            className="grid gap-8 lg:grid-cols-3"
          >
            {steps.map((step) => (
              <motion.div
                key={step.number}
                variants={fadeUp}
                className="relative rounded-2xl border border-white/[0.06] bg-white/[0.02] p-8"
              >
                <span className="text-display-lg text-brand-500/20 font-bold">
                  {step.number}
                </span>
                <div className="mt-4 mb-3 inline-flex rounded-xl bg-white/5 p-2.5 text-white/60">
                  <step.icon size={22} strokeWidth={1.5} />
                </div>
                <h3 className="text-heading-2 text-white mb-2">
                  {step.title}
                </h3>
                <p className="text-body-sm text-white/40 leading-relaxed">
                  {step.description}
                </p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Trust / Why SmartLots */}
      <section className="relative py-24 lg:py-32 border-t border-white/[0.06]">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="grid gap-12 lg:grid-cols-2 items-center">
            <motion.div
              variants={stagger}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-100px" }}
            >
              <motion.p
                variants={fadeUp}
                className="text-overline text-brand-500 mb-3"
              >
                Why SmartLots Pro
              </motion.p>
              <motion.h2
                variants={fadeUp}
                className="text-3xl sm:text-4xl font-semibold tracking-tight mb-6"
              >
                Built for dealerships that refuse to lose a car
              </motion.h2>
              <motion.p
                variants={fadeUp}
                className="text-body-lg text-white/40 leading-relaxed mb-8"
              >
                Whether you manage 50 vehicles or 5,000 across multiple
                locations, SmartLots Pro scales with your operation. No more
                radio calls, sticky notes, or spreadsheets.
              </motion.p>

              <motion.ul variants={stagger} className="space-y-4">
                {[
                  "Photo proof at every handoff protects against claims",
                  "Role-based access for managers, valets, and attendants",
                  "Works offline — syncs when connectivity returns",
                  "Secure, cloud-based — nothing to install on-premise",
                  "Dedicated admin portal for dealership management",
                ].map((item) => (
                  <motion.li
                    key={item}
                    variants={fadeUp}
                    className="flex items-start gap-3"
                  >
                    <CheckCircle2
                      size={18}
                      className="text-brand-500 mt-0.5 shrink-0"
                    />
                    <span className="text-body-sm text-white/60">{item}</span>
                  </motion.li>
                ))}
              </motion.ul>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
              className="relative rounded-2xl border border-white/[0.06] bg-white/[0.02] p-8 lg:p-10"
            >
              <div className="space-y-5">
                {[
                  {
                    icon: Car,
                    title: "Vehicle Intake",
                    desc: "Scan VIN, snap photos, assign to a lot — in under 60 seconds.",
                  },
                  {
                    icon: MapPin,
                    title: "Park & Track",
                    desc: "Know exactly where every vehicle is parked across all your locations.",
                  },
                  {
                    icon: Camera,
                    title: "Move & Document",
                    desc: "Every movement is logged with photos, timestamps, and user attribution.",
                  },
                  {
                    icon: CheckCircle2,
                    title: "Deliver with Confidence",
                    desc: "Complete delivery with final photos and a full audit trail.",
                  },
                ].map((item) => (
                  <div
                    key={item.title}
                    className="flex gap-4 items-start rounded-xl bg-white/[0.03] border border-white/[0.04] p-4"
                  >
                    <div className="shrink-0 rounded-lg bg-brand-500/10 p-2 text-brand-500">
                      <item.icon size={18} strokeWidth={1.5} />
                    </div>
                    <div>
                      <p className="text-body-sm font-medium text-white">
                        {item.title}
                      </p>
                      <p className="text-caption text-white/40 mt-0.5">
                        {item.desc}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* CTA / Contact */}
      <section
        id="contact"
        className="relative py-24 lg:py-32 border-t border-white/[0.06]"
      >
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={stagger}
            className="mx-auto max-w-2xl text-center"
          >
            <motion.h2
              variants={fadeUp}
              className="text-3xl sm:text-4xl font-semibold tracking-tight"
            >
              Ready to take control of your lot?
            </motion.h2>
            <motion.p
              variants={fadeUp}
              className="mt-4 text-lg text-white/40"
            >
              Get your dealership set up in minutes. No hardware required — just
              download the app and go.
            </motion.p>
            <motion.div
              variants={fadeUp}
              className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4"
            >
              <a
                href="mailto:info@smartlotpro.com?subject=SmartLots%20Pro%20Demo%20Request"
                className="group flex items-center gap-2 rounded-xl bg-brand-500 px-8 py-4 text-body font-medium text-white hover:bg-brand-600 transition-all hover:shadow-[0_0_30px_0_rgba(238,63,67,0.3)]"
              >
                Request a Demo
                <ArrowRight
                  size={16}
                  className="group-hover:translate-x-0.5 transition-transform"
                />
              </a>
              <a
                href="mailto:support@smartlotpro.com"
                className="flex items-center gap-2 rounded-xl border border-white/15 bg-white/5 px-8 py-4 text-body font-medium text-white/80 hover:bg-white/10 hover:text-white transition-all backdrop-blur"
              >
                Contact Support
              </a>
            </motion.div>
            <motion.p
              variants={fadeUp}
              className="mt-6 text-caption text-white/30"
            >
              Available for iOS &middot; Admin portal included &middot; No
              long-term contracts
            </motion.p>
          </motion.div>
        </div>
      </section>
    </>
  );
}
