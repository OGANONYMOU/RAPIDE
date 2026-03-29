import { prisma } from '../config/database';
import { VehicleType, PackageSize, DeliveryType } from '@prisma/client';

interface PricingInput {
  vehicleType: VehicleType;
  packageSize: PackageSize;
  distanceKm: number;
  deliveryType: DeliveryType;
  surgeMultiplier?: number;
}

interface PricingResult {
  basePrice: number;
  distancePrice: number;
  urgencyFee: number;
  vehicleFee: number;
  totalPrice: number;
  breakdown: Record<string, number>;
}

const PACKAGE_SIZE_MULTIPLIERS: Record<PackageSize, number> = {
  SMALL: 1.0,
  MEDIUM: 1.3,
  LARGE: 1.6,
  EXTRA_LARGE: 2.0,
};

export const calculatePrice = async (input: PricingInput): Promise<PricingResult> => {
  const { vehicleType, packageSize, distanceKm, deliveryType, surgeMultiplier = 1.0 } = input;

  // Fetch pricing rule from database
  const pricingRule = await prisma.pricingRule.findFirst({
    where: { vehicleType, isActive: true },
  });

  // Sensible fallback defaults if no DB rule yet
  const rule = pricingRule || {
    basePrice: vehicleType === 'BIKE' ? 500 : vehicleType === 'CAR' ? 1000 : vehicleType === 'VAN' ? 2000 : 3000,
    pricePerKm: vehicleType === 'BIKE' ? 150 : vehicleType === 'CAR' ? 250 : vehicleType === 'VAN' ? 350 : 500,
    minimumPrice: vehicleType === 'BIKE' ? 500 : vehicleType === 'CAR' ? 1000 : 2000,
  };

  // Fetch urgency fee
  const urgencyFeeRecord = await prisma.urgencyFee.findFirst({
    where: { deliveryType, isActive: true },
  });

  const basePrice = rule.basePrice;
  const distancePrice = Math.max(0, distanceKm) * rule.pricePerKm;
  const sizeMultiplier = PACKAGE_SIZE_MULTIPLIERS[packageSize];
  const urgencyFee = urgencyFeeRecord?.feeAmount || (deliveryType === 'EXPRESS' ? 500 : 0);
  const vehicleFee = 0; // Can be expanded for special vehicle surcharges

  const subtotal = (basePrice + distancePrice) * sizeMultiplier + urgencyFee + vehicleFee;
  const surgeTotal = subtotal * surgeMultiplier;
  const totalPrice = Math.max(rule.minimumPrice, Math.round(surgeTotal / 5) * 5); // Round to nearest 5 XOF

  return {
    basePrice,
    distancePrice: distancePrice * sizeMultiplier,
    urgencyFee,
    vehicleFee,
    totalPrice,
    breakdown: {
      base: basePrice,
      distance: distancePrice,
      sizeMultiplier,
      urgency: urgencyFee,
      surge: surgeMultiplier,
      total: totalPrice,
    },
  };
};
