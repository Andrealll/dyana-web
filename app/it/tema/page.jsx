import TemaPageBase from "../../../components/tema/TemaPageBase";
import { TEMA_COPY_IT } from "../../../components/tema/temaCopy";

export const metadata = {
  title: "Tema Natale | DYANA",
  description:
    "Scopri il tuo profilo astrologico personale con una lettura basata sui tuoi dati di nascita reali.",
  alternates: {
    canonical: "/it/tema",
  },
};

export default function TemaPageIT() {
  return <TemaPageBase copy={TEMA_COPY_IT} pagePath="/it/tema" />;
}