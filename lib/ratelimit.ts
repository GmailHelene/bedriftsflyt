// Rate-limiting flyttet til den delte pakken kundebox-sikker-kjerne (samme
// logikk, nå delt med andre Kundebox-produkter). Denne fila re-eksporterer
// bare, slik at ingen av de andre filene som importerer herfra må endres.
export { erRateLimited } from "@gronbergtech/kundebox-sikker-kjerne";
