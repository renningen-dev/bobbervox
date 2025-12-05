from fastapi import HTTPException


class BobberVoxException(HTTPException):
    def __init__(self, status_code: int, detail: str):
        super().__init__(status_code=status_code, detail=detail)


class ProjectNotFoundError(BobberVoxException):
    def __init__(self, project_id: str):
        super().__init__(status_code=404, detail=f"Project with ID {project_id} not found")


class SegmentNotFoundError(BobberVoxException):
    def __init__(self, segment_id: str):
        super().__init__(status_code=404, detail=f"Segment with ID {segment_id} not found")


class FileValidationError(BobberVoxException):
    def __init__(self, detail: str):
        super().__init__(status_code=400, detail=detail)


class ProcessingError(BobberVoxException):
    def __init__(self, detail: str):
        super().__init__(status_code=500, detail=detail)


class ExternalAPIError(BobberVoxException):
    def __init__(self, detail: str):
        super().__init__(status_code=502, detail=detail)
