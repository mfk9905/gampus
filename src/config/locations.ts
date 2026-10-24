export interface Neighborhood {
  name: string;
  lat: number;
  lng: number;
}

export interface District {
  name: string;
  defaultLat: number;
  defaultLng: number;
  neighborhoods: Neighborhood[];
}

export const ISTANBUL_DISTRICTS: District[] = [
  {
    name: 'Kadıköy',
    defaultLat: 40.9916,
    defaultLng: 29.0274,
    neighborhoods: [
      { name: 'Moda / Caferağa', lat: 40.9841, lng: 29.0267 },
      { name: 'Rasimpaşa (Yeldeğirmeni)', lat: 40.9962, lng: 29.0289 },
      { name: 'Fikirtepe', lat: 40.9984, lng: 29.0492 },
      { name: 'Osmanağa (Boğa & Çarşı)', lat: 40.9916, lng: 29.0274 },
      { name: 'Hasanpaşa', lat: 40.9986, lng: 29.0392 },
      { name: 'Acıbadem', lat: 41.0062, lng: 29.0435 },
      { name: 'Koşuyolu', lat: 41.0118, lng: 29.0368 },
      { name: 'Göztepe (Marmara Kampüs)', lat: 40.9866, lng: 29.0539 },
      { name: 'Fenerbahçe', lat: 40.9723, lng: 29.0412 },
      { name: 'Bostancı', lat: 40.9634, lng: 29.0967 },
      { name: 'Suadiye', lat: 40.9662, lng: 29.0831 },
      { name: 'Caddebostan', lat: 40.9702, lng: 29.0684 },
    ],
  },
  {
    name: 'Beşiktaş',
    defaultLat: 41.0428,
    defaultLng: 29.0076,
    neighborhoods: [
      { name: 'Akaretler / Vişnezade', lat: 41.0412, lng: 29.0006 },
      { name: 'Sinanpaşa (Çarşı & İskele)', lat: 41.0428, lng: 29.0076 },
      { name: 'Abbasağa', lat: 41.0482, lng: 29.0068 },
      { name: 'Yıldız / Çırağan', lat: 41.0475, lng: 29.0178 },
      { name: 'Dikilitaş', lat: 41.0531, lng: 29.0062 },
      { name: 'Ortaköy', lat: 41.0489, lng: 29.0267 },
      { name: 'Gayrettepe', lat: 41.0664, lng: 29.0072 },
      { name: 'Levent (Nispetiye)', lat: 41.0815, lng: 29.0165 },
      { name: 'Bebek', lat: 41.0768, lng: 29.0436 },
      { name: 'Etiler', lat: 41.0825, lng: 29.0345 },
    ],
  },
  {
    name: 'Sarıyer',
    defaultLat: 41.1165,
    defaultLng: 29.0543,
    neighborhoods: [
      { name: 'Maslak (İTÜ Ayazağa)', lat: 41.1053, lng: 29.0234 },
      { name: 'Ayazağa (Köy İçi & Vadistanbul)', lat: 41.1092, lng: 28.9958 },
      { name: 'Rumelihisarı (Boğaziçi Hisarüstü)', lat: 41.0847, lng: 29.0510 },
      { name: 'Reşitpaşa', lat: 41.1098, lng: 29.0378 },
      { name: 'İstinye', lat: 41.1125, lng: 29.0562 },
      { name: 'Emirgan', lat: 41.1034, lng: 29.0536 },
      { name: 'Tarabya', lat: 41.1378, lng: 29.0542 },
      { name: 'Yeniköy', lat: 41.1215, lng: 29.0689 },
      { name: 'Bahçeköy', lat: 41.1712, lng: 28.9934 },
      { name: 'Sarıyer Merkez', lat: 41.1685, lng: 29.0556 },
    ],
  },
  {
    name: 'Fatih',
    defaultLat: 41.0182,
    defaultLng: 28.9484,
    neighborhoods: [
      { name: 'Beyazıt (İstanbul Üni Ana Kampüs)', lat: 41.0128, lng: 28.9644 },
      { name: 'Cibali (Kadir Has Üni)', lat: 41.0256, lng: 28.9587 },
      { name: 'Çapa / Şehremini (Tıp Fakültesi)', lat: 41.0142, lng: 28.9378 },
      { name: 'Fındıkzade', lat: 41.0115, lng: 28.9412 },
      { name: 'Aksaray', lat: 41.0098, lng: 28.9495 },
      { name: 'Balat / Fener', lat: 41.0315, lng: 28.9489 },
      { name: 'Vefa / Süleymaniye', lat: 41.0175, lng: 28.9598 },
      { name: 'Kocamustafapaşa / Cerrahpaşa', lat: 40.9982, lng: 28.9367 },
    ],
  },
  {
    name: 'Şişli',
    defaultLat: 41.0602,
    defaultLng: 28.9877,
    neighborhoods: [
      { name: 'Mecidiyeköy (Metro & Metrobüs)', lat: 41.0668, lng: 28.9934 },
      { name: 'Osmanbey / Halaskargazi', lat: 41.0542, lng: 28.9892 },
      { name: 'Bomonti', lat: 41.0592, lng: 28.9798 },
      { name: 'Nişantaşı / Teşvikiye', lat: 41.0512, lng: 28.9945 },
      { name: 'Fulya', lat: 41.0578, lng: 29.0012 },
      { name: 'Gülbahar', lat: 41.0712, lng: 28.9967 },
      { name: 'Esentepe', lat: 41.0725, lng: 29.0089 },
      { name: 'Kuştepe (Bilgi Üni)', lat: 41.0728, lng: 28.9845 },
    ],
  },
  {
    name: 'Üsküdar',
    defaultLat: 41.0267,
    defaultLng: 29.0152,
    neighborhoods: [
      { name: 'Üsküdar Merkez / İskele', lat: 41.0267, lng: 29.0152 },
      { name: 'Bağlarbaşı (Marmara İlahiyat)', lat: 41.0289, lng: 29.0345 },
      { name: 'Altunizade (Üsküdar & 29 Mayıs Üni)', lat: 41.0234, lng: 29.0438 },
      { name: 'Kuzguncuk', lat: 41.0345, lng: 29.0289 },
      { name: 'Çengelköy', lat: 41.0512, lng: 29.0523 },
      { name: 'Beylerbeyi', lat: 41.0423, lng: 29.0456 },
      { name: 'Acıbadem / Ünalan', lat: 41.0089, lng: 29.0512 },
      { name: 'Salacak', lat: 41.0189, lng: 29.0134 },
    ],
  },
  {
    name: 'Esenler',
    defaultLat: 41.0382,
    defaultLng: 28.8872,
    neighborhoods: [
      { name: 'Davutpaşa (YTÜ Kampüs)', lat: 41.0264, lng: 28.8900 },
      { name: 'Menderes (Metro)', lat: 41.0382, lng: 28.8872 },
      { name: 'Çiftehavuzlar', lat: 41.0289, lng: 28.8967 },
      { name: 'Birlik Mahallesi', lat: 41.0467, lng: 28.8834 },
    ],
  },
  {
    name: 'Avcılar',
    defaultLat: 40.9798,
    defaultLng: 28.7215,
    neighborhoods: [
      { name: 'Üniversite Mahallesi (İÜC Kampüs)', lat: 40.9902, lng: 28.7246 },
      { name: 'Avcılar Merkez', lat: 40.9798, lng: 28.7215 },
      { name: 'Cihangir', lat: 40.9856, lng: 28.7134 },
      { name: 'Gümüşpala (Metrobüs)', lat: 40.9878, lng: 28.7345 },
      { name: 'Firuzköy', lat: 41.0067, lng: 28.7189 },
    ],
  },
  {
    name: 'Beykoz',
    defaultLat: 41.1324,
    defaultLng: 29.1012,
    neighborhoods: [
      { name: 'Kavacık (Medipol Üni)', lat: 41.0924, lng: 29.0886 },
      { name: 'Rüzgarlıbahçe', lat: 41.0998, lng: 29.0967 },
      { name: 'Anadoluhisarı (Marmara BESYO)', lat: 41.0823, lng: 29.0667 },
      { name: 'Göksu Evleri', lat: 41.0789, lng: 29.0745 },
      { name: 'Beykoz Merkez', lat: 41.1324, lng: 29.1012 },
    ],
  },
  {
    name: 'Eyüpsultan',
    defaultLat: 41.0482,
    defaultLng: 28.9345,
    neighborhoods: [
      { name: 'Silahtarağa (Bilgi Santral Kampüs)', lat: 41.0673, lng: 28.9460 },
      { name: 'Alibeyköy (Tramvay & Metro)', lat: 41.0745, lng: 28.9512 },
      { name: 'Eyüp Merkez / İskele', lat: 41.0482, lng: 28.9345 },
      { name: 'Göktürk', lat: 41.1823, lng: 28.8945 },
      { name: 'Yeşilpınar', lat: 41.0812, lng: 28.9289 },
    ],
  },
  {
    name: 'Beyoğlu',
    defaultLat: 41.0369,
    defaultLng: 28.9774,
    neighborhoods: [
      { name: 'Taksim / Gümüşsuyu (İTÜ Taşkışla/Gümüşsuyu)', lat: 41.0369, lng: 28.9874 },
      { name: 'Cihangir', lat: 41.0323, lng: 28.9834 },
      { name: 'Galata / Karaköy', lat: 41.0256, lng: 28.9745 },
      { name: 'Asmalımescit / Şişhane', lat: 41.0298, lng: 28.9734 },
      { name: 'Kasımpaşa', lat: 41.0345, lng: 28.9634 },
    ],
  },
  {
    name: 'Kağıthane',
    defaultLat: 41.0812,
    defaultLng: 28.9745,
    neighborhoods: [
      { name: 'Seyrantepe (Marmara & İTÜ Yakını)', lat: 41.1012, lng: 29.0045 },
      { name: 'Çeliktepe (Levent Metro)', lat: 41.0856, lng: 29.0067 },
      { name: 'Gültepe', lat: 41.0789, lng: 29.0034 },
      { name: 'Kağıthane Merkez (M7 Metro)', lat: 41.0812, lng: 28.9745 },
      { name: 'Emniyet Evleri', lat: 41.0898, lng: 29.0098 },
    ],
  },
  {
    name: 'Bakırköy',
    defaultLat: 40.9782,
    defaultLng: 28.8724,
    neighborhoods: [
      { name: 'Bakırköy Merkez / Özgürlük Meydanı', lat: 40.9782, lng: 28.8724 },
      { name: 'Ataköy (Kültür & İstanbul Aydın Üni)', lat: 40.9856, lng: 28.8478 },
      { name: 'İncirli / Kartaltepe', lat: 40.9945, lng: 28.8689 },
      { name: 'Yeşilköy', lat: 40.9612, lng: 28.8256 },
      { name: 'Zuhuratbaba', lat: 40.9867, lng: 28.8678 },
    ],
  },
  {
    name: 'Maltepe',
    defaultLat: 40.9245,
    defaultLng: 29.1512,
    neighborhoods: [
      { name: 'Maltepe Merkez', lat: 40.9245, lng: 29.1512 },
      { name: 'Cevizli (Marmara Dragos Kampüs)', lat: 40.9134, lng: 29.1478 },
      { name: 'Zümrütevler', lat: 40.9389, lng: 29.1412 },
      { name: 'Küçükyalı', lat: 40.9467, lng: 29.1234 },
      { name: 'İdealtepe', lat: 40.9412, lng: 29.1123 },
    ],
  },
  {
    name: 'Zeytinburnu',
    defaultLat: 40.9912,
    defaultLng: 28.9012,
    neighborhoods: [
      { name: 'Cevizlibağ / Merkezefendi (Yıldız & Biruni Üni)', lat: 41.0112, lng: 28.9134 },
      { name: 'Seyitnizam', lat: 41.0023, lng: 28.9056 },
      { name: 'Zeytinburnu Merkez', lat: 40.9912, lng: 28.9012 },
      { name: 'Kazlıçeşme (Marmaray)', lat: 40.9878, lng: 28.9189 },
    ],
  },
  {
    name: 'Ataşehir',
    defaultLat: 40.9845,
    defaultLng: 29.1156,
    neighborhoods: [
      { name: 'Batı Ataşehir (Varyap & Ülker Arena)', lat: 40.9923, lng: 29.1089 },
      { name: 'İçerenköy (Yeditepe Üni Yakını)', lat: 40.9712, lng: 29.1045 },
      { name: 'Küçükbakkalköy (Acıbadem Üni)', lat: 40.9789, lng: 29.1134 },
      { name: 'Kayışdağı (Yeditepe Ana Kampüs)', lat: 40.9723, lng: 29.1523 },
      { name: 'Örnek Mahallesi', lat: 41.0045, lng: 29.0789 },
    ],
  },
  {
    name: 'Küçükçekmece',
    defaultLat: 41.0012,
    defaultLng: 28.7845,
    neighborhoods: [
      { name: 'Sefaköy / Tevfik Bey (Aydın Üni)', lat: 41.0089, lng: 28.7956 },
      { name: 'Cennet Mahallesi', lat: 40.9889, lng: 28.7834 },
      { name: 'Halkalı (Sabahattin Zaim Üni)', lat: 41.0345, lng: 28.7812 },
      { name: 'Atakent', lat: 41.0456, lng: 28.7967 },
    ],
  },
];

export function getDistrictByName(name: string): District | undefined {
  return ISTANBUL_DISTRICTS.find(
    (d) => d.name.toLowerCase() === name.toLowerCase()
  );
}

export function getAllDistrictNames(): string[] {
  return ISTANBUL_DISTRICTS.map((d) => d.name);
}
