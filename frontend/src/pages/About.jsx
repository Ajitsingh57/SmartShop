import React, { useEffect, useState } from "react";

const About = () => {
  // Developer team profile details and social links
  const [aboutData, setAboutData] = useState({
    leader: {
      name: "Your Name",
      role: "Team Leader & Full Stack Developer",
      image: "",
      bio: "I am the team leader responsible for planning, development and overall technical direction of the project.",
      skills: ["React", "Node.js", "MongoDB", "JavaScript", "REST API"],
      links: {
        linkedin: "",
        github: "",
        instagram: "",
        facebook: "",
        twitter: "",
      },
    },
    teammates: [
      {
        id: 1,
        name: "Team Member",
        role: "Developer",
        image: "",
        bio: "Contributing to the development and implementation of the project.",
        links: {
          linkedin: "",
          github: "",
          instagram: "",
          facebook: "",
          twitter: "",
        },
      },
    ],
    project: {
      title: "Our Project",
      description:
        "A modern shop management system designed to make product, customer, sales, payment and credit management simple and efficient.",
    },
  });

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(false);
  }, []);

  const socialLinks = [
    { key: "linkedin", name: "LinkedIn", shortName: "in" },
    { key: "github", name: "GitHub", shortName: "GH" },
    { key: "instagram", name: "Instagram", shortName: "IG" },
    { key: "facebook", name: "Facebook", shortName: "f" },
    { key: "twitter", name: "Twitter / X", shortName: "X" },
  ];

  const openLink = (url) => {
    if (!url) return;
    window.open(url, "_blank", "noopener,noreferrer");
  };

  const SocialButton = ({ name, shortName, url }) => {
    return (
      <button
        type="button"
        disabled={!url}
        onClick={() => openLink(url)}
        title={url ? `Open ${name}` : `${name} link not added yet`}
        className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium transition-all duration-300 ${
          url
            ? "border-zinc-800 bg-zinc-900 text-zinc-300 hover:border-[var(--app-accent-border)] hover:bg-[var(--app-accent)] hover:text-white"
            : "cursor-default border-zinc-800 bg-zinc-950 text-zinc-600"
        }`}
      >
        <span className="flex h-6 w-6 items-center justify-center rounded-md bg-zinc-800 text-[10px] font-bold">
          {shortName}
        </span>
        <span>{name}</span>
      </button>
    );
  };

  const SocialLinks = ({ links = {} }) => {
    return (
      <div className="mt-7 flex flex-wrap justify-center gap-2 md:justify-start">
        {socialLinks.map((social) => (
          <SocialButton
            key={social.key}
            name={social.name}
            shortName={social.shortName}
            url={links?.[social.key]}
          />
        ))}
      </div>
    );
  };

  const ProfileImage = ({ image, name, large = false }) => {
    if (image) {
      return (
        <img
          src={image}
          alt={name}
          className={`${
            large ? "h-40 w-40 sm:h-48 sm:w-48" : "h-24 w-24"
          } rounded-full border-4 border-[var(--app-accent-border)] object-cover`}
        />
      );
    }

    return (
      <div
        className={`${
          large ? "h-40 w-40 text-5xl sm:h-48 sm:w-48 sm:text-6xl" : "h-24 w-24 text-3xl"
        } flex items-center justify-center rounded-full border-4 border-[var(--app-accent-border)] bg-[var(--app-accent)] font-bold text-white shadow-lg`}
        style={{ boxShadow: "0 10px 25px var(--app-accent-soft)" }}
      >
        {name?.charAt(0)?.toUpperCase() || "U"}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="w-full px-5 py-10 sm:px-6 md:px-[50px]">
        <p className="text-center text-zinc-400">Loading...</p>
      </div>
    );
  }

  return (
    <div className="w-full px-5 pb-16 sm:px-6 md:px-[50px]">
      <div className="mb-12 text-center">
        <p className="mb-3 text-sm font-semibold uppercase tracking-[0.2em] text-[var(--app-accent)]">
          About Us
        </p>
        <h1 className="text-3xl font-bold text-white sm:text-4xl lg:text-5xl">
          Meet Our Team
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-sm leading-7 text-zinc-400 sm:text-base">
          Get to know the people behind the project and the vision that drives us forward.
        </p>
      </div>

      <section className="mx-auto mb-16 max-w-5xl rounded-2xl border border-zinc-800 bg-zinc-900/70 p-6 sm:p-8">
        <h2 className="mb-3 text-2xl font-bold text-white">
          {aboutData.project.title}
        </h2>
        <p className="max-w-4xl leading-7 text-zinc-400">
          {aboutData.project.description}
        </p>
      </section>

      {/* Team leader profile */}
      <section className="mx-auto mb-20 max-w-5xl">
        <div className="mb-6">
          <p className="text-sm font-semibold uppercase tracking-wider text-[var(--app-accent)]">
            Leadership
          </p>
          <h2 className="mt-2 text-2xl font-bold text-white sm:text-3xl">
            Team Leader
          </h2>
        </div>

        <div
          className="relative overflow-hidden rounded-3xl border border-[var(--app-accent-border)] p-6 shadow-[0_20px_60px_rgba(0,0,0,0.3)] sm:p-10"
          style={{
            background:
              "radial-gradient(circle at top right, var(--app-accent-soft), transparent 60%), linear-gradient(135deg, var(--app-surface-light) 0%, var(--app-surface) 100%)",
          }}
        >
          <div className="pointer-events-none absolute -right-20 -top-20 h-56 w-56 rounded-full bg-[var(--app-accent-soft)] blur-3xl" />

          <div className="relative flex flex-col items-center gap-8 md:flex-row md:items-start">
            <div className="shrink-0">
              <ProfileImage
                image={aboutData.leader.image}
                name={aboutData.leader.name}
                large
              />
            </div>

            <div className="flex-1 text-center md:text-left">
              <div className="mb-3 inline-flex rounded-full border border-[var(--app-accent-border)] bg-[var(--app-accent-soft)] px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-[var(--app-accent)]">
                Leader
              </div>

              <h3 className="text-3xl font-bold text-white sm:text-4xl">
                {aboutData.leader.name}
              </h3>

              <p className="mt-2 text-base font-medium text-[var(--app-accent)]">
                {aboutData.leader.role}
              </p>

              <p className="mx-auto mt-5 max-w-2xl text-sm leading-7 text-zinc-400 md:mx-0">
                {aboutData.leader.bio}
              </p>

              {aboutData.leader.skills?.length > 0 && (
                <div className="mt-6 flex flex-wrap justify-center gap-2 md:justify-start">
                  {aboutData.leader.skills.map((skill) => (
                    <span
                      key={skill}
                      className="rounded-full border border-zinc-700 bg-zinc-950 px-3 py-1.5 text-xs text-zinc-300"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              )}

              <SocialLinks links={aboutData.leader.links} />
            </div>
          </div>
        </div>
      </section>

      {/* Team members collection */}
      {aboutData.teammates?.length > 0 && (
        <section className="mx-auto max-w-6xl">
          <div className="mb-8">
            <p className="text-sm font-semibold uppercase tracking-wider text-[var(--app-accent)]">
              Our Team
            </p>
            <h2 className="mt-2 text-2xl font-bold text-white sm:text-3xl">
              Team Members
            </h2>
          </div>

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {aboutData.teammates.map((member) => (
              <div
                key={member.id}
                className="rounded-2xl border border-zinc-800 bg-zinc-900/70 p-6 transition-all duration-300 hover:-translate-y-1 hover:border-zinc-700"
              >
                <div className="mb-5 flex justify-center">
                  <ProfileImage image={member.image} name={member.name} />
                </div>

                <div className="text-center">
                  <h3 className="text-xl font-bold text-white">{member.name}</h3>
                  <p className="mt-1 text-sm font-medium text-[var(--app-accent)]">
                    {member.role}
                  </p>
                </div>

                <p className="mt-4 text-center text-sm leading-6 text-zinc-500">
                  {member.bio}
                </p>

                <SocialLinks links={member.links} />
              </div>
            ))}
          </div>
        </section>
      )}

      <section className="mx-auto mt-20 max-w-4xl text-center">
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 px-6 py-8">
          <h2 className="text-xl font-bold text-white sm:text-2xl">
            Built with passion and teamwork.
          </h2>
          <p className="mx-auto mt-3 max-w-2xl text-sm leading-6 text-zinc-500">
            Every member contributes to making the project better, while strong leadership keeps the team moving in the right direction.
          </p>
        </div>
      </section>
    </div>
  );
};

export default About;