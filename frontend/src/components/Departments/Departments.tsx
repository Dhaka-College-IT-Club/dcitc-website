import { DEPARTMENTS } from "../../constants";
import Card from "../ui/Card";
import Reveal from "../ui/Reveal";
import { Container, Section } from "../ui/Section";
import SectionTitle from "../ui/SectionTitle";

export default function Departments() {
  return (
    <Section id="departments" seam>
      <Container>
        <Reveal>
          <SectionTitle
            eyebrow="Six teams"
            title="Departments"
            subtitle="Specialized teams driving innovation"
          />

          <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {DEPARTMENTS.map((department) => {
              const Icon = department.icon;
              return (
                <Card key={department.title} as="article" interactive tick>
                  <div
                    className="mb-5 flex h-12 w-12 items-center justify-center border border-line-strong bg-surface-2"
                    style={{ color: department.color }}
                  >
                    <Icon className="h-5 w-5" aria-hidden="true" />
                  </div>
                  <h3 className="type-h3">{department.title}</h3>
                  <p className="type-body-sm mt-2 text-subtle">
                    {department.description}
                  </p>
                </Card>
              );
            })}
          </div>
        </Reveal>
      </Container>
    </Section>
  );
}
