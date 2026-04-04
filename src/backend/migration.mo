import Nat "mo:core/Nat";
import Array "mo:core/Array";
import Iter "mo:core/Iter";

module {
  // Legacy product type (without openingDate) used for migration
  type ProductV1 = {
    id : Nat;
    name : Text;
    brand : Text;
    categoryId : Nat;
    openingStock : Nat;
    currentStock : Nat;
    unit : Text;
    lowStockThreshold : Nat;
    rackNumber : Text;
  };

  // Legacy staff type (without pinned) - matches previous stable var shape
  type StaffV1 = {
    id : Nat;
    name : Text;
    role : Text;
    mobile : Text;
  };

  type UsageRecord = {
    id : Nat;
    date : Text;
    productId : Nat;
    categoryId : Nat;
    staffId : Nat;
    quantity : Nat;
    time : Text;
    clientName : Text;
  };

  type EquipmentItem = {
    id : Nat;
    name : Text;
  };

  type EquipmentCheckout = {
    id : Nat;
    staffId : Nat;
    equipmentId : Nat;
    date : Text;
    takenAt : Text;
    returnedAt : Text;
  };

  type AttendanceEntry = {
    id : Nat;
    date : Text;
    staffId : Nat;
    status : Text;
  };

  type CashEntry = {
    id : Nat;
    date : Text;
    entryType : Text;
    amount : Nat;
    description : Text;
    recipientStaffId : Nat;
    notes : Text;
  };

  type HomeServiceSettlement = {
    id : Nat;
    date : Text;
    staffId : Nat;
    clientName : Text;
    serviceAmount : Nat;
    clientPaid : Nat;
    travelExpense : Nat;
    notes : Text;
  };

  type PackItem = {
    id : Nat;
    name : Text;
    unit : Text;
  };

  // PackStock is mapped to PackArrival
  type PackStock = {
    id : Nat;
    itemId : Nat;
    date : Text;
    quantity : Nat;
    notes : Text;
  };

  // PackUsage is mapped to PackDistribution
  type PackUsage = {
    id : Nat;
    itemId : Nat;
    date : Text;
    time : Text;
    staffId : Nat;
    quantity : Nat;
    notes : Text;
  };

  type OldActor = {
    categories : [Category];
    products : [ProductV1];
    products_v2 : [Product];
    staff : [StaffV1];
    staff_v2 : [Staff];
    usageRecords : [UsageRecord];
    equipmentItems : [EquipmentItem];
    equipmentCheckouts : [EquipmentCheckout];
    attendanceEntries : [AttendanceEntry];
    cashEntries : [CashEntry];
    homeServiceSettlements : [HomeServiceSettlement];
    packItems : [PackItem];
    packStocks : [PackStock];
    packUsages : [PackUsage];
    nextCategoryId : Nat;
    nextProductId : Nat;
    nextStaffId : Nat;
    nextUsageId : Nat;
    nextEquipmentItemId : Nat;
    nextEquipmentCheckoutId : Nat;
    nextAttendanceId : Nat;
    nextCashEntryId : Nat;
    nextHomeServiceSettlementId : Nat;
    nextPackItemId : Nat;
    nextPackStockId : Nat;
    nextPackUsageId : Nat;
  };

  type Category = {
    id : Nat;
    name : Text;
  };

  // New product type (with openingDate)
  type Product = {
    id : Nat;
    name : Text;
    brand : Text;
    categoryId : Nat;
    openingStock : Nat;
    openingDate : Text;
    currentStock : Nat;
    unit : Text;
    lowStockThreshold : Nat;
    rackNumber : Text;
  };

  // New staff type (with pinned)
  type Staff = {
    id : Nat;
    name : Text;
    role : Text;
    mobile : Text;
    pinned : Bool;
  };

  type PackArrival = {
    id : Nat;
    packItemId : Nat;
    date : Text;
    quantity : Nat;
    notes : Text;
  };

  type PackDistribution = {
    id : Nat;
    packItemId : Nat;
    date : Text;
    time : Text;
    staffId : Nat;
    quantity : Nat;
    notes : Text;
  };

  type NewActor = {
    categories : [Category];
    products : [Product];
    staff : [Staff];
    usageRecords : [UsageRecord];
    equipmentItems : [EquipmentItem];
    equipmentCheckouts : [EquipmentCheckout];
    attendanceEntries : [AttendanceEntry];
    cashEntries : [CashEntry];
    homeServiceSettlements : [HomeServiceSettlement];
    packItems : [PackItem];
    packArrivals : [PackArrival];
    packDistributions : [PackDistribution];
    nextCategoryId : Nat;
    nextProductId : Nat;
    nextStaffId : Nat;
    nextUsageRecordId : Nat;
    nextEquipmentItemId : Nat;
    nextEquipmentCheckoutId : Nat;
    nextAttendanceEntryId : Nat;
    nextCashEntryId : Nat;
    nextHomeServiceSettlementId : Nat;
    nextPackItemId : Nat;
    nextPackArrivalId : Nat;
    nextPackDistributionId : Nat;
  };

  public func run(old : OldActor) : NewActor {
    // Migrate products without openingDate
    let legacyProductsWithOpeningDate = old.products.map(
      func(p) {
        {
          id = p.id;
          name = p.name;
          brand = p.brand;
          categoryId = p.categoryId;
          openingStock = p.openingStock;
          openingDate = "";
          currentStock = p.currentStock;
          unit = p.unit;
          lowStockThreshold = p.lowStockThreshold;
          rackNumber = p.rackNumber;
        };
      }
    );

    // Use products from products_v2 if available, otherwise fallback to legacy
    let migratedProducts = if (old.products_v2.size() > 0) {
      old.products_v2
    } else {
      legacyProductsWithOpeningDate;
    };

    // Migrate staff without pinned field
    let legacyStaffWithPinned = old.staff.map(
      func(s) {
        {
          id = s.id;
          name = s.name;
          role = s.role;
          mobile = s.mobile;
          pinned = false;
        };
      }
    );

    // Use staff_v2 if available, otherwise fallback to legacy (with pinned=false)
    let migratedStaff = if (old.staff_v2.size() > 0) {
      old.staff_v2;
    } else {
      legacyStaffWithPinned;
    };

    // Migrate pack stocks to arrivals
    let newPackArrivals = old.packStocks.map(
      func(s) {
        {
          id = s.id;
          packItemId = s.itemId;
          date = s.date;
          quantity = s.quantity;
          notes = s.notes;
        }
      }
    );

    // Migrate pack usages to distributions
    let newPackDistributions = old.packUsages.map(
      func(u) {
        {
          id = u.id;
          packItemId = u.itemId;
          date = u.date;
          time = u.time;
          staffId = u.staffId;
          quantity = u.quantity;
          notes = u.notes;
        }
      }
    );

    {
      categories = old.categories;
      products = migratedProducts;
      staff = migratedStaff;
      usageRecords = old.usageRecords;
      equipmentItems = old.equipmentItems;
      equipmentCheckouts = old.equipmentCheckouts;
      attendanceEntries = old.attendanceEntries;
      cashEntries = old.cashEntries;
      homeServiceSettlements = old.homeServiceSettlements;
      packItems = old.packItems;
      packArrivals = newPackArrivals;
      packDistributions = newPackDistributions;
      nextCategoryId = old.nextCategoryId;
      nextProductId = old.nextProductId;
      nextStaffId = old.nextStaffId;
      nextUsageRecordId = old.nextUsageId;
      nextEquipmentItemId = old.nextEquipmentItemId;
      nextEquipmentCheckoutId = old.nextEquipmentCheckoutId;
      nextAttendanceEntryId = old.nextAttendanceId;
      nextCashEntryId = old.nextCashEntryId;
      nextHomeServiceSettlementId = old.nextHomeServiceSettlementId;
      nextPackItemId = old.nextPackItemId;
      nextPackArrivalId = old.nextPackStockId;
      nextPackDistributionId = old.nextPackUsageId;
    };
  };
};
