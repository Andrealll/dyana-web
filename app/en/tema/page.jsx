import TemaPageBase from "../../../components/tema/TemaPageBase";
import { TEMA_COPY_EN } from "../../../components/tema/temaCopy";

export const metadata = {
  title: "Birth Chart Reading | DYANA",
  description:
    "Discover your personal astrological profile with a reading based on your real birth data.",
  alternates: {
    canonical: "/en/tema",
  },
};

export default function TemaPageEN() {
  return <TemaPageBase copy={TEMA_COPY_EN} pagePath="/en/tema" />;
}