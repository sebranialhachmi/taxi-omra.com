import airportTransferImage from "@/assets/airport-transfer.jpg";
import businessTravelImage from "@/assets/business-travel.jpg";
import luxuryCarImage from "@/assets/hero-luxury-car.jpg";
import suvImage from "@/assets/fleet-suv.jpg";
import vanImage from "@/assets/fleet-van.jpg";

type BlogImagePost = {
  slug?: string | null;
  cover_url?: string | null;
  tags?: string[] | null;
};

const fallbackImages = [airportTransferImage, luxuryCarImage, suvImage, vanImage, businessTravelImage];

function stableIndex(value: string) {
  return Array.from(value).reduce((total, character) => total + character.charCodeAt(0), 0) % fallbackImages.length;
}

/** Every published article gets a stable, relevant cover even when the CMS has no uploaded image. */
export function blogCoverImage(post: BlogImagePost) {
  const uploadedCover = post.cover_url?.trim();
  if (uploadedCover) return uploadedCover;

  const subject = `${post.slug ?? ""} ${(post.tags ?? []).join(" ")}`.toLowerCase();
  if (/airport|مطار/.test(subject)) return airportTransferImage;
  if (/vip|luxury|business|chauffeur|سائق-خاص|فاخر/.test(subject)) return businessTravelImage;
  if (/family|group|van|minibus|عائل|مجموعة/.test(subject)) return vanImage;
  if (/suv|جبل|taif|abha|طائف|أبها/.test(subject)) return suvImage;

  return fallbackImages[stableIndex(post.slug ?? "article")];
}