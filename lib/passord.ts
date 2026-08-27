// Passordhashing flyttet til den delte pakken kundebox-sikker-kjerne (samme
// scrypt-implementasjon som lå her fra før, nå delt med andre Kundebox-produkter).
export { hashPassord, verifiserPassord } from "@gronbergtech/kundebox-sikker-kjerne";
