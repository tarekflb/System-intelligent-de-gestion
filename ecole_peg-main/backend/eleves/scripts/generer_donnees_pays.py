import json
import pycountry
import phonenumbers.phonenumberutil as phone_util
from typing import List
from pathlib import Path
from .pays_fr import PAYS_FR


def generer_donnees_pays() -> List[dict]:
    listePays = []
    id = 1

    for pays in pycountry.countries:
        try:
            indicatif = phone_util.country_code_for_region(pays.alpha_2)
            nom = PAYS_FR.get(pays.alpha_2)

            if indicatif and nom:
                listePays.append(
                    {
                        "model": "eleves.pays",
                        "pk": id,
                        "fields": {
                            "indicatif": f"+{indicatif}",
                            "nom": nom,
                        },
                    }
                )

                id += 1
        except Exception:
            continue

    with open(Path("eleves/fixtures/pays.json"), "w", encoding="utf-8") as f:
        json.dump(listePays, f, ensure_ascii=False, indent=4)

    return listePays


if __name__ == "__main__":
    generer_donnees_pays()
