'use client';

import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import { fadeUp, staggerContainer } from '@/lib/animations';
import { getToken } from '@/lib/auth';
import {
  Sparkles,
  Users,
  BookOpen,
  Globe,
  Heart,
  Target,
  Rocket,
  Handshake,
  Lightbulb,
  GraduationCap,
} from 'lucide-react';
import Link from 'next/link';

const stats = [
  {
    value: '50K+',
    label: 'Active Learners',
    icon: Users,
    gradient: 'from-purple-500 to-indigo-600',
  },
  {
    value: '10K+',
    label: 'Courses Created',
    icon: BookOpen,
    gradient: 'from-blue-500 to-cyan-600',
  },
  {
    value: '23+',
    label: 'Languages',
    icon: Globe,
    gradient: 'from-green-500 to-emerald-600',
  },
  {
    value: '95%',
    label: 'Satisfaction Rate',
    icon: Heart,
    gradient: 'from-red-500 to-pink-600',
  },
];

const team = [
  {
    name: 'Sarah Chen',
    role: 'CEO & Founder',
    bio: 'Former AI researcher at MIT, passionate about democratizing education.',
    initials: 'SC',
  },
  {
    name: 'Michael Rodriguez',
    role: 'CTO',
    bio: 'Ex-Google engineer specializing in machine learning and NLP.',
    initials: 'MR',
  },
  {
    name: 'Emily Watson',
    role: 'Head of Education',
    bio: '15+ years in curriculum development and educational technology.',
    initials: 'EW',
  },
  {
    name: 'David Kim',
    role: 'Lead Designer',
    bio: 'Award-winning UX designer focused on accessible learning experiences.',
    initials: 'DK',
  },
];

const values = [
  {
    icon: Target,
    title: 'Mission-Driven',
    description:
      'We believe education should be accessible to everyone, everywhere.',
    gradient: 'from-purple-500 to-indigo-600',
  },
  {
    icon: Rocket,
    title: 'Innovation First',
    description:
      'Pushing the boundaries of AI to create better learning experiences.',
    gradient: 'from-blue-500 to-cyan-600',
  },
  {
    icon: Handshake,
    title: 'Community Focused',
    description: 'Building a global community of learners and educators.',
    gradient: 'from-green-500 to-emerald-600',
  },
  {
    icon: Lightbulb,
    title: 'Continuous Learning',
    description: 'We practice what we preach - always learning and improving.',
    gradient: 'from-orange-500 to-amber-600',
  },
];

function useIsLoggedIn(): boolean {
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    setIsLoggedIn(Boolean(getToken()));
  }, []);

  return isLoggedIn;
}

function HeroSection(): JSX.Element {
  return (
    <section className="relative min-h-[80vh] flex items-center justify-center overflow-hidden bg-gradient-to-br from-white via-purple-50/30 to-blue-50/40 pt-24">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-purple-300 rounded-full blur-[120px] opacity-20 animate-pulse"></div>
        <div
          className="absolute top-1/3 right-1/4 w-[500px] h-[500px] bg-blue-300 rounded-full blur-[140px] opacity-15 animate-pulse"
          style={{ animationDelay: '1s' }}
        ></div>
        <div className="absolute bottom-0 left-0 w-full h-96 bg-gradient-to-t from-purple-100/40 via-transparent to-transparent"></div>
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-pink-200 rounded-full blur-[120px] opacity-20"></div>
      </div>
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] opacity-30"></div>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-24 sm:py-32 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="max-w-5xl mx-auto text-center"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            className="inline-block mb-6 sm:mb-8"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-purple-100 to-blue-100 border border-purple-200/50 shadow-sm backdrop-blur-sm">
              <motion.div
                animate={{ rotate: [0, 10, -10, 0] }}
                transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
              >
                <Sparkles
                  className="w-4 h-4 sm:w-5 sm:h-5 text-purple-600"
                  strokeWidth={1.5}
                />
              </motion.div>
              <span className="text-xs tracking-widest text-purple-600 font-semibold uppercase">
                ABOUT US
              </span>
            </div>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-bold text-gray-900 mb-6 sm:mb-8 leading-[1.1] tracking-tight"
          >
            Transforming Education with{' '}
            <span className="relative inline-block italic font-light bg-gradient-to-r from-purple-600 via-purple-500 to-blue-600 bg-clip-text text-transparent px-2 -mx-1">
              AI
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="text-lg sm:text-xl md:text-2xl text-gray-700 leading-relaxed max-w-3xl mx-auto font-medium"
          >
            We're on a mission to make quality education accessible to everyone
            through the power of artificial intelligence. Our platform empowers
            educators and learners worldwide.
          </motion.p>
        </motion.div>
      </div>
    </section>
  );
}

function StatsSection(): JSX.Element {
  return (
    <section className="relative py-16 sm:py-20 lg:py-24 bg-gradient-to-b from-white via-purple-50/20 to-white overflow-hidden">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-96 bg-purple-200 rounded-full blur-3xl opacity-20" />
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12 sm:mb-16"
        >
          <div className="inline-flex items-center gap-2 mb-4 sm:mb-6">
            <Sparkles
              className="w-4 h-4 sm:w-5 sm:h-5 text-purple-600"
              strokeWidth={1.5}
            />
            <span className="text-xs tracking-widest text-purple-600/80 font-medium uppercase">
              OUR IMPACT
            </span>
          </div>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Making an Impact Worldwide
          </h2>
        </motion.div>
        <motion.div
          variants={staggerContainer}
          initial="initial"
          whileInView="animate"
          viewport={{ once: true, amount: 0.2 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 lg:gap-8"
        >
          {stats.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <motion.div
                key={index}
                variants={fadeUp}
                whileHover={{ scale: 1.05, y: -12 }}
                className="relative group"
              >
                <div className="text-center p-6 sm:p-8 bg-gradient-to-br from-gray-50 to-white rounded-2xl transition-all duration-300 cursor-pointer border border-gray-100 shadow-md hover:shadow-2xl">
                  <motion.div
                    className={`relative mb-4 w-16 h-16 sm:w-20 sm:h-20 mx-auto rounded-2xl bg-gradient-to-br ${stat.gradient} flex items-center justify-center shadow-lg group-hover:shadow-2xl transition-shadow duration-300`}
                    whileHover={{
                      scale: 1.1,
                      rotate: [0, -5, 5, 0],
                      transition: { duration: 0.5 },
                    }}
                  >
                    <Icon className="w-8 h-8 sm:w-10 sm:h-10 text-white" />
                  </motion.div>
                  <div
                    className={`text-3xl sm:text-4xl md:text-5xl font-bold bg-gradient-to-r ${stat.gradient} bg-clip-text text-transparent mb-2`}
                  >
                    {stat.value}
                  </div>
                  <div className="text-xs sm:text-sm text-gray-600 font-medium">
                    {stat.label}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </motion.div>
      </div>
    </section>
  );
}

function MissionSection(): JSX.Element {
  return (
    <section className="relative py-16 sm:py-20 lg:py-24 bg-white overflow-hidden">
      <div className="absolute top-0 right-0 w-96 h-96 bg-blue-200 rounded-full blur-3xl opacity-10" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-purple-200 rounded-full blur-3xl opacity-10" />

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="max-w-4xl mx-auto"
        >
          <div className="text-center mb-8 sm:mb-12">
            <div className="inline-flex items-center gap-2 mb-4 sm:mb-6">
              <Sparkles
                className="w-4 h-4 sm:w-5 sm:h-5 text-purple-600"
                strokeWidth={1.5}
              />
              <span className="text-xs tracking-widest text-purple-600/80 font-medium uppercase">
                OUR STORY
              </span>
            </div>
          </div>
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-4xl sm:text-5xl md:text-6xl font-bold text-gray-900 mb-8 sm:mb-12 text-center leading-tight"
          >
            Our Story
          </motion.h2>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="space-y-6 sm:space-y-8 text-base sm:text-lg md:text-xl text-gray-700 leading-relaxed"
          >
            <p>
              AiCourse Generator was born from a simple observation: creating
              quality educational content is time-consuming and expensive, while
              millions of people worldwide lack access to personalized learning
              experiences.
            </p>
            <p>
              In 2023, our founders—a team of AI researchers, educators, and
              technologists—came together with a vision to democratize education
              through artificial intelligence. We believed that AI could not
              only make content creation faster but also make learning more
              personalized and effective.
            </p>
            <p>
              Today, we're proud to serve over 50,000 learners and educators
              across 150+ countries, offering courses in 23+ languages. But
              we're just getting started. Our goal is to make quality education
              accessible to everyone, everywhere.
            </p>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}

function ValueCard({ value }: { value: (typeof values)[number] }): JSX.Element {
  const Icon = value.icon;
  return (
    <motion.div
      variants={fadeUp}
      whileHover={{ y: -16, scale: 1.02 }}
      className="relative group"
    >
      <div className="relative bg-gradient-to-br from-gray-50 to-white rounded-2xl p-6 sm:p-8 transition-all duration-300 cursor-pointer border border-gray-100 shadow-md hover:shadow-2xl overflow-hidden">
        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700">
          <div
            className={`absolute inset-0 bg-gradient-to-br ${value.gradient} opacity-5`}
          />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(0,0,0,0.02),transparent_70%)]" />
        </div>
        <div className="relative z-10">
          <motion.div
            className={`relative mb-6 w-20 h-20 sm:w-24 sm:h-24 rounded-3xl bg-gradient-to-br ${value.gradient} flex items-center justify-center shadow-lg group-hover:shadow-2xl transition-shadow duration-300`}
            whileHover={{
              scale: 1.1,
              rotate: [0, -5, 5, 0],
              transition: { duration: 0.5 },
            }}
          >
            <Icon className="w-10 h-10 sm:w-12 sm:h-12 text-white" />
            <motion.div
              className={`absolute inset-0 rounded-3xl bg-gradient-to-br ${value.gradient} opacity-0 group-hover:opacity-30 blur-xl`}
              animate={{ scale: [1, 1.3, 1], opacity: [0, 0.3, 0] }}
              transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
            />
          </motion.div>
          <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-3 group-hover:text-gray-800 transition-colors duration-300">
            {value.title}
          </h3>
          <p className="text-sm sm:text-base text-gray-600 leading-relaxed group-hover:text-gray-700 transition-colors duration-300">
            {value.description}
          </p>
          <motion.div
            className={`mt-6 h-1 w-16 rounded-full bg-gradient-to-r ${value.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-500`}
            initial={{ width: 0 }}
            whileHover={{ width: 64 }}
            transition={{ duration: 0.3 }}
          />
        </div>
        <div
          className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${value.gradient} opacity-0 group-hover:opacity-5 rounded-bl-full transition-opacity duration-500`}
        />
      </div>
    </motion.div>
  );
}

function ValuesSection(): JSX.Element {
  return (
    <section className="relative py-16 sm:py-20 lg:py-24 bg-gradient-to-b from-white via-purple-50/20 to-white overflow-hidden">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-96 bg-purple-200 rounded-full blur-3xl opacity-20" />
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <motion.div
          variants={fadeUp}
          initial="initial"
          whileInView="animate"
          viewport={{ once: true }}
          className="text-center mb-12 sm:mb-16"
        >
          <div className="inline-flex items-center gap-2 mb-4 sm:mb-6">
            <Sparkles
              className="w-4 h-4 sm:w-5 sm:h-5 text-purple-600"
              strokeWidth={1.5}
            />
            <span className="text-xs tracking-widest text-purple-600/80 font-medium uppercase">
              OUR VALUES
            </span>
          </div>
          <h2 className="text-4xl sm:text-5xl md:text-6xl font-bold text-gray-900 mb-4 sm:mb-6 leading-tight">
            Our Values
          </h2>
          <p className="text-base sm:text-lg text-gray-600 max-w-2xl mx-auto">
            The principles that guide everything we do
          </p>
        </motion.div>
        <motion.div
          variants={staggerContainer}
          initial="initial"
          whileInView="animate"
          viewport={{ once: true, amount: 0.2 }}
          className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8"
        >
          {values.map((value, index) => (
            <ValueCard key={index} value={value} />
          ))}
        </motion.div>
      </div>
    </section>
  );
}

function TeamMemberCard({
  member,
}: {
  member: (typeof team)[number];
}): JSX.Element {
  return (
    <motion.div
      variants={fadeUp}
      whileHover={{ y: -16, scale: 1.03 }}
      className="relative group"
    >
      <div className="relative bg-gradient-to-br from-gray-50 to-white rounded-2xl p-6 sm:p-8 transition-all duration-300 cursor-pointer border border-gray-100 shadow-md hover:shadow-2xl text-center overflow-hidden">
        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700">
          <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-indigo-500/5" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(0,0,0,0.02),transparent_70%)]" />
        </div>
        <div className="relative z-10">
          <motion.div
            className="w-20 h-20 sm:w-24 sm:h-24 mx-auto mb-6 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 border-2 border-purple-300 flex items-center justify-center text-white font-bold text-xl sm:text-2xl group-hover:scale-110 group-hover:shadow-lg group-hover:shadow-purple-300 transition-all duration-300"
            whileHover={{
              rotate: [0, 5, -5, 0],
              transition: { duration: 0.5 },
            }}
          >
            {member.initials}
          </motion.div>
          <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-2 group-hover:text-purple-600 transition-colors duration-300">
            {member.name}
          </h3>
          <div className="text-sm text-purple-600 mb-4 font-medium">
            {member.role}
          </div>
          <p className="text-sm text-gray-600 leading-relaxed group-hover:text-gray-700 transition-colors duration-300">
            {member.bio}
          </p>
        </div>
        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-purple-500/5 to-indigo-500/5 opacity-0 group-hover:opacity-100 rounded-bl-full transition-opacity duration-500" />
      </div>
    </motion.div>
  );
}

function TeamSection(): JSX.Element {
  return (
    <section className="relative py-16 sm:py-20 lg:py-24 bg-white overflow-hidden">
      <div className="absolute top-0 right-0 w-96 h-96 bg-blue-200 rounded-full blur-3xl opacity-10" />
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <motion.div
          variants={fadeUp}
          initial="initial"
          whileInView="animate"
          viewport={{ once: true }}
          className="text-center mb-12 sm:mb-16"
        >
          <div className="inline-flex items-center gap-2 mb-4 sm:mb-6">
            <Sparkles
              className="w-4 h-4 sm:w-5 sm:h-5 text-purple-600"
              strokeWidth={1.5}
            />
            <span className="text-xs tracking-widest text-purple-600/80 font-medium uppercase">
              OUR TEAM
            </span>
          </div>
          <h2 className="text-4xl sm:text-5xl md:text-6xl font-bold text-gray-900 mb-4 sm:mb-6 leading-tight">
            Meet Our Team
          </h2>
          <p className="text-base sm:text-lg text-gray-600 max-w-2xl mx-auto">
            The passionate people behind AiCourse Generator
          </p>
        </motion.div>
        <motion.div
          variants={staggerContainer}
          initial="initial"
          whileInView="animate"
          viewport={{ once: true, amount: 0.2 }}
          className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8"
        >
          {team.map((member, index) => (
            <TeamMemberCard key={index} member={member} />
          ))}
        </motion.div>
      </div>
    </section>
  );
}

function CTAButton({ isLoggedIn }: { isLoggedIn: boolean }) {
  return (
    <Link
      href={isLoggedIn ? '/dashboard' : '/register'}
      className="inline-block"
    >
      <motion.div
        whileHover={{
          scale: 1.05,
          boxShadow: '0 25px 50px rgba(139, 92, 246, 0.4)',
          transition: { duration: 0.3 },
        }}
        whileTap={{ scale: 0.95 }}
        className="group relative flex items-center justify-center gap-3 px-8 sm:px-12 py-4 sm:py-5 bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-xl hover:from-purple-700 hover:to-purple-800 transition-all duration-300 shadow-xl shadow-purple-500/40 cursor-pointer font-semibold text-base sm:text-lg overflow-hidden"
      >
        <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
        <GraduationCap className="w-5 h-5 relative z-10" />
        <span className="relative z-10">Get Started Today</span>
        <svg
          className="w-5 h-5 transform group-hover:translate-x-1 transition-transform duration-300 relative z-10"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 5l7 7-7 7"
          />
        </svg>
      </motion.div>
    </Link>
  );
}

function CallToActionSection({
  isLoggedIn,
}: {
  isLoggedIn: boolean;
}): JSX.Element {
  return (
    <section className="relative py-16 sm:py-20 lg:py-24 bg-gradient-to-b from-white via-purple-50/30 to-white overflow-hidden">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-purple-300 rounded-full blur-[120px] opacity-20"></div>
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-blue-300 rounded-full blur-[120px] opacity-20"></div>
      </div>
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="max-w-4xl mx-auto text-center"
        >
          <div className="relative bg-gradient-to-br from-purple-50/80 to-purple-100/80 backdrop-blur-sm border border-purple-200/50 rounded-3xl p-8 sm:p-12 overflow-hidden">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(147,51,234,0.1),transparent_70%)]" />
            <div className="relative z-10">
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                className="inline-flex items-center gap-2 mb-6"
              >
                <motion.div
                  animate={{ rotate: [0, 10, -10, 0] }}
                  transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
                >
                  <Sparkles
                    className="w-4 h-4 sm:w-5 sm:h-5 text-purple-600"
                    strokeWidth={1.5}
                  />
                </motion.div>
                <span className="text-xs tracking-widest text-purple-600 font-semibold uppercase">
                  JOIN US
                </span>
              </motion.div>
              <motion.h2
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.1 }}
                className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-900 mb-4 sm:mb-6 leading-tight"
              >
                Join Us on This Journey
              </motion.h2>
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.2 }}
                className="text-base sm:text-lg text-gray-700 mb-8 max-w-2xl mx-auto"
              >
                Whether you're an educator looking to create courses or a
                learner seeking knowledge, we'd love to have you as part of our
                community.
              </motion.p>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.3 }}
              >
                <CTAButton isLoggedIn={isLoggedIn} />
              </motion.div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

export default function AboutPage() {
  const isLoggedIn = useIsLoggedIn();

  return (
    <main className="min-h-screen bg-white">
      {/* Hero Section */}
      <HeroSection />

      {/* Stats Section */}
      <StatsSection />

      {/* Mission Section */}
      <MissionSection />

      {/* Values Section */}
      <ValuesSection />

      {/* Team Section */}
      <TeamSection />

      {/* CTA Section */}
      <CallToActionSection isLoggedIn={isLoggedIn} />
    </main>
  );
}
