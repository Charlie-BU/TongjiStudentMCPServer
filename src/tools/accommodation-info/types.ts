export type AccommodationInfoToolStatus = "ok" | "empty" | "unauthorized" | "upstream_unavailable";

export interface AccommodationRecord {
    accomBuildingCode: string | null;
    accomBuildingName: string | null;
    accomRegionCode: string | null;
    accomRegionName: string | null;
    deptCode: string | null;
    deptName: string | null;
    floor: string | null;
    name: string | null;
    roomNo: string | null;
    userId: string | null;
    usertypeCode: string | null;
    usertypeName: string | null;
}

export interface AccommodationInfoData {
    records: AccommodationRecord[];
}

export interface AccommodationInfoToolResult {
    [key: string]: unknown;
    status: AccommodationInfoToolStatus;
    data: AccommodationInfoData;
    source: "Tongji Open Platform";
}
