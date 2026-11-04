// Tüm Firestore koleksiyonları — yeni ekranların (davet, profil, demo veri)
// doğrudan kullanabildiği tipli servisler. Görünümler ise uyumluluk
// katmanındaki (src/lib/api.ts) api.get/post/... çağrılarını kullanır.
import { koleksiyon } from './crud'
import type {
  Birim,
  DavetKodu,
  Gider,
  Indirim,
  KdvOrani,
  KullaniciProfili,
  Kategori,
  Masa,
  MutfakGrubu,
  Musteri,
  Ozellik,
  Odenmez,
  Siparis,
  Urun,
  Zayi,
} from './tipler'

export const kategorilerServis = koleksiyon<Kategori>('categories', 'sortOrder')
export const urunlerServis = koleksiyon<Urun>('products', 'createdAt')
export const birimlerServis = koleksiyon<Birim>('units', 'name')
export const ozelliklerServis = koleksiyon<Ozellik>('features', 'name')
export const kdvServis = koleksiyon<KdvOrani>('vatRates', 'rate')
export const indirimlerServis = koleksiyon<Indirim>('discounts', 'name')
export const mutfakGruplariServis = koleksiyon<MutfakGrubu>('kitchenGroups', 'name')
export const musterilerServis = koleksiyon<Musteri>('customers', 'name')
export const odenmezlerServis = koleksiyon<Odenmez>('nonpayers', 'name')
export const masalarServis = koleksiyon<Masa>('tables', 'name')
export const siparislerServis = koleksiyon<Siparis>('orders', 'createdAt', 'desc')
export const giderlerServis = koleksiyon<Gider>('expenses', 'spentAt', 'desc')
export const zayilarServis = koleksiyon<Zayi>('wastes', 'wastedAt', 'desc')
export const kullaniciProfilleriServis = koleksiyon<KullaniciProfili>('users', 'name')
export const davetKodlariServis = koleksiyon<DavetKodu>('invites', 'createdAt', 'desc')
