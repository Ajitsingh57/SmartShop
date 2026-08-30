import React from "react";
import { Link } from "react-router-dom";

const About = () => {
  // Lead developer profile details
  const developer = {
    name: "Ajit Singh",
    role: "Team Leader & Full Stack Developer",
    image: "/images/developer.jpg",
    bio: "Passionate Full Stack Developer and Team Leader focused on building modern, scalable, and user-friendly web applications. I designed and developed the core architecture, REST APIs, database models, and responsive interfaces for the SmartShop management system.",
    skills: [
      "React.js",
      "Node.js",
      "Express.js",
      "MongoDB",
      "JavaScript",
      "REST APIs",
      "TailwindCSS",
      "Git & GitHub",
      "Java",
      "C++",
      "DSA",
    ],
    links: {
      github: "https://github.com/Ajitsingh57",
      linkedin: "https://www.linkedin.com/in/ajit-kumar-79b3b9402",
      portfolio: "https://github.com/Ajitsingh57",
      email: "mailto:ajitsingh.aks27@gmail.com",
    },
  };

  // Team contributor profiles
  const teammates = [
    {
      name: "Teammate Name",
      role: "Team Member",
      image: "/images/teammate1.jpg",
      links: {
        github: "https://github.com/",
        linkedin: "https://linkedin.com/",
      },
    },
    {
      name: "Teammate Name",
      role: "Team Member",
      image: "/images/teammate2.jpg",
      links: {
        github: "https://github.com/",
        linkedin: "https://linkedin.com/",
      },
    },
    {
      name: "Teammate Name",
      role: "Team Member",
      image: "/images/teammate3.jpg",
      links: {
        github: "https://github.com/",
        linkedin: "https://linkedin.com/",
      },
    },
  ];

  const GithubIcon = () => (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor">
      <path d="M12 .5C5.65.5.5 5.65.5 12c0 5.08 3.29 9.39 7.86 10.91.57.1.78-.25.78-.55v-2.13c-3.2.69-3.87-1.54-3.87-1.54-.52-1.33-1.28-1.68-1.28-1.68-1.05-.72.08-.71.08-.71 1.16.08 1.77 1.19 1.77 1.19 1.03 1.76 2.7 1.25 3.36.96.1-.75.4-1.25.73-1.54-2.56-.29-5.26-1.28-5.26-5.7 0-1.26.45-2.29 1.19-3.1-.12-.29-.52-1.47.11-3.06 0 0 .97-.31 3.18 1.18a11.1 11.1 0 0 1 5.8 0c2.21-1.5 3.18-1.18 3.18-1.18.63 1.59.23 2.77.11 3.06.74.81 1.19 1.84 1.19 3.1 0 4.43-2.7 5.41-5.27 5.69.41.35.78 1.04.78 2.1v3.11c0 .3.21.66.79.55A11.51 11.51 0 0 0 23.5 12C23.5 5.65 18.35.5 12 .5Z" />
    </svg>
  );

  const LinkedinIcon = () => (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor">
      <path d="M20.45 20.45h-3.56v-5.57c0-1.33-.03-3.04-1.85-3.04-1.85 0-2.14 1.45-2.14 2.94v5.67H9.34V8.99h3.42v1.56h.05c.48-.9 1.64-1.85 3.38-1.85 3.62 0 4.29 2.38 4.29 5.48v6.27ZM5.32 7.43a2.07 2.07 0 1 1 0-4.14 2.07 2.07 0 0 1 0 4.14ZM3.54 20.45H7.1V8.99H3.54v11.46ZM22.23 0H1.77C.79 0 0 .77 0 1.73v20.54C0 23.23.79 24 1.77 24h20.46c.98 0 1.77-.77 1.77-1.73V1.73C24 .77 23.21 0 22.23 0Z" />
    </svg>
  );

  const MailIcon = () => (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8">
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="m4 7 8 6 8-6" />
    </svg>
  );

  return (
    <div
      className="min-h-screen w-full px-4 py-6 sm:px-6 md:px-10 lg:px-12"
      style={{
        backgroundColor: "var(--app-bg)",
        color: "var(--app-text)",
      }}
    >
      <div className="mx-auto max-w-6xl">
        <div className="mb-8">
          <Link
            to="/settings"
            className="mb-5 inline-flex items-center gap-2 text-xs font-medium transition-colors"
            style={{ color: "var(--app-accent)" }}
          >
            ← Back to Settings
          </Link>
          <p className="mb-2 text-sm font-medium" style={{ color: "var(--app-accent)" }}>
            SmartShop Team
          </p>
          <h1 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
            About Developer
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-500 sm:text-base">
            Meet the developer and team behind the SmartShop management system.
          </p>
        </div>

        {/* Lead developer showcase */}
        <section
          className="relative mb-8 overflow-hidden rounded-2xl border p-6 shadow-[0_10px_40px_rgba(0,0,0,0.35)] sm:p-8"
          style={{
            borderColor: "var(--app-accent-border)",
            background: `radial-gradient(circle at 85% 15%, var(--app-accent-soft), transparent 35%), linear-gradient(135deg, var(--app-surface-light) 0%, var(--app-surface) 100%)`,
          }}
        >
          <div className="relative z-10 grid gap-8 lg:grid-cols-[280px_minmax(0,1fr)] lg:items-center">
            <div className="flex flex-col items-center text-center lg:border-r lg:border-zinc-800 lg:pr-8">
              <div
                className="relative rounded-full p-1"
                style={{ background: "linear-gradient(135deg,var(--app-accent),transparent)" }}
              >
                <img
                  src={developer.image}
                  alt={developer.name}
                  className="h-44 w-44 rounded-full border-4 border-zinc-950 object-cover sm:h-52 sm:w-52"
                  onError={(e) => {
                    e.currentTarget.style.display = "none";
                    e.currentTarget.nextElementSibling.style.display = "flex";
                  }}
                />
                <div
                  className="hidden h-44 w-44 items-center justify-center rounded-full border-4 border-zinc-950 text-5xl font-bold sm:h-52 sm:w-52"
                  style={{
                    backgroundColor: "var(--app-accent-soft)",
                    color: "var(--app-accent)",
                  }}
                >
                  {developer.name
                    .split(" ")
                    .map((word) => word[0])
                    .slice(0, 2)
                    .join("")
                    .toUpperCase()}
                </div>
              </div>

              <h2 className="mt-5 text-2xl font-bold text-white">{developer.name}</h2>
              <p className="mt-1 text-sm font-medium" style={{ color: "var(--app-accent)" }}>
                {developer.role}
              </p>

              <div className="mt-5 flex items-center gap-2">
                <a
                  href={developer.links.github}
                  target="_blank"
                  rel="noreferrer"
                  className="flex h-9 w-9 items-center justify-center rounded-lg border transition-all"
                  style={{
                    borderColor: "var(--app-border)",
                    backgroundColor: "var(--app-surface)",
                    color: "var(--app-accent)",
                  }}
                  aria-label="GitHub"
                >
                  <GithubIcon />
                </a>
                <a
                  href={developer.links.linkedin}
                  target="_blank"
                  rel="noreferrer"
                  className="flex h-9 w-9 items-center justify-center rounded-lg border transition-all"
                  style={{
                    borderColor: "var(--app-border)",
                    backgroundColor: "var(--app-surface)",
                    color: "var(--app-accent)",
                  }}
                  aria-label="LinkedIn"
                >
                  <LinkedinIcon />
                </a>
                <a
                  href={developer.links.email}
                  className="flex h-9 w-9 items-center justify-center rounded-lg border transition-all"
                  style={{
                    borderColor: "var(--app-border)",
                    backgroundColor: "var(--app-surface)",
                    color: "var(--app-accent)",
                  }}
                  aria-label="Email"
                >
                  <MailIcon />
                </a>
              </div>
            </div>

            <div>
              <div
                className="mb-5 inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider"
                style={{
                  backgroundColor: "var(--app-accent-soft)",
                  color: "var(--app-accent)",
                }}
              >
                Lead Developer & Team Leader
              </div>

              <h3 className="text-2xl font-bold text-white sm:text-3xl">
                Building SmartShop with modern technology.
              </h3>
              <p className="mt-4 max-w-2xl text-sm leading-7 text-zinc-400">
                {developer.bio}
              </p>

              <div className="mt-6">
                <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-zinc-600">
                  Technologies & Skills
                </p>
                <div className="flex flex-wrap gap-2">
                  {developer.skills.map((skill) => (
                    <span
                      key={skill}
                      className="rounded-lg border px-3 py-1.5 text-xs font-medium"
                      style={{
                        borderColor: "var(--app-border)",
                        backgroundColor: "var(--app-surface)",
                        color: "var(--app-accent)",
                      }}
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>

              <div className="mt-7 flex flex-wrap gap-3">
                <a
                  href={developer.links.github}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 rounded-lg px-4 py-2.5 text-xs font-semibold text-white transition-all hover:-translate-y-[1px]"
                  style={{ backgroundColor: "var(--app-accent)" }}
                >
                  <GithubIcon />
                  GitHub
                </a>
                <a
                  href={developer.links.linkedin}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 rounded-lg border px-4 py-2.5 text-xs font-semibold transition-all hover:-translate-y-[1px]"
                  style={{
                    borderColor: "var(--app-border)",
                    backgroundColor: "var(--app-surface)",
                    color: "var(--app-accent)",
                  }}
                >
                  <LinkedinIcon />
                  LinkedIn
                </a>
                <a
                  href={developer.links.portfolio}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 rounded-lg border px-4 py-2.5 text-xs font-semibold transition-all hover:-translate-y-[1px]"
                  style={{
                    borderColor: "var(--app-border)",
                    backgroundColor: "var(--app-surface)",
                    color: "var(--app-accent)",
                  }}
                >
                  Portfolio →
                </a>
              </div>
            </div>
          </div>
        </section>

        {/* Project contribution breakdown */}
        <section
          className="mb-8 rounded-xl border p-5 sm:p-6"
          style={{
            borderColor: "var(--app-border)",
            backgroundColor: "var(--app-surface)",
          }}
        >
          <div className="mb-5">
            <p
              className="text-[10px] font-semibold uppercase tracking-wider"
              style={{ color: "var(--app-accent)" }}
            >
              Project
            </p>
            <h2 className="mt-1 text-lg font-semibold text-white">SmartShop Management System</h2>
            <p className="mt-1 max-w-2xl text-xs leading-5 text-zinc-600">
              A complete shop management solution designed to simplify everyday retail operations.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {[
              ["Frontend", "Modern responsive admin interface"],
              ["Backend", "REST API and business logic"],
              ["Database", "Structured shop data management"],
              ["Authentication", "Secure role-based access"],
            ].map(([title, description]) => (
              <div
                key={title}
                className="rounded-xl border p-4"
                style={{
                  borderColor: "var(--app-border)",
                  backgroundColor: "var(--app-surface-light)",
                }}
              >
                <p className="text-sm font-semibold text-zinc-200">{title}</p>
                <p className="mt-1 text-xs leading-5 text-zinc-600">{description}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Team members grid */}
        <section>
          <div className="mb-5">
            <p
              className="text-[10px] font-semibold uppercase tracking-wider"
              style={{ color: "var(--app-accent)" }}
            >
              The Team
            </p>
            <h2 className="mt-1 text-xl font-bold text-white">Team Members</h2>
            <p className="mt-1 text-xs text-zinc-600">
              The people who contributed to the SmartShop project.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {teammates.map((member) => (
              <div
                key={member.name}
                className="rounded-xl border p-5 transition-all duration-300 hover:-translate-y-1"
                style={{
                  borderColor: "var(--app-border)",
                  backgroundColor: "var(--app-surface)",
                }}
              >
                <div className="flex items-center gap-4">
                  <div
                    className="shrink-0 rounded-full p-0.5"
                    style={{ backgroundColor: "var(--app-accent-border)" }}
                  >
                    <img
                      src={member.image}
                      alt={member.name}
                      className="h-16 w-16 rounded-full border-2 border-zinc-950 object-cover"
                      onError={(e) => {
                        e.currentTarget.style.display = "none";
                        e.currentTarget.nextElementSibling.style.display = "flex";
                      }}
                    />
                    <div
                      className="hidden h-16 w-16 items-center justify-center rounded-full border-2 border-zinc-950 text-sm font-bold"
                      style={{
                        backgroundColor: "var(--app-accent-soft)",
                        color: "var(--app-accent)",
                      }}
                    >
                      {member.name
                        .split(" ")
                        .map((word) => word[0])
                        .slice(0, 2)
                        .join("")
                        .toUpperCase()}
                    </div>
                  </div>

                  <div className="min-w-0">
                    <h3 className="truncate text-sm font-semibold text-white">{member.name}</h3>
                    <p className="mt-1 text-xs font-medium" style={{ color: "var(--app-accent)" }}>
                      {member.role}
                    </p>
                  </div>
                </div>

                <div className="mt-5 flex gap-2">
                  <a
                    href={member.links.github}
                    target="_blank"
                    rel="noreferrer"
                    className="flex h-8 w-8 items-center justify-center rounded-lg border"
                    style={{
                      borderColor: "var(--app-border)",
                      color: "var(--app-accent)",
                    }}
                    aria-label={`${member.name} GitHub`}
                  >
                    <GithubIcon />
                  </a>
                  <a
                    href={member.links.linkedin}
                    target="_blank"
                    rel="noreferrer"
                    className="flex h-8 w-8 items-center justify-center rounded-lg border"
                    style={{
                      borderColor: "var(--app-border)",
                      color: "var(--app-accent)",
                    }}
                    aria-label={`${member.name} LinkedIn`}
                  >
                    <LinkedinIcon />
                  </a>
                </div>
              </div>
            ))}
          </div>
        </section>

        <div className="py-10 text-center">
          <p className="text-xs text-zinc-700">Designed & Developed for SmartShop</p>
          <p className="mt-1 text-[10px]" style={{ color: "var(--app-accent)" }}>
            SmartShop Management System
          </p>
        </div>
      </div>
    </div>
  );
};

export default About;