"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "useLivePreview", {
    enumerable: true,
    get: function() {
        return useLivePreview;
    }
});
const _livepreview = require("@payloadcms/live-preview");
const _vue = require("vue");
const useLivePreview = (props)=>{
    const { apiRoute, depth, initialData, serverURL } = props;
    const data = (0, _vue.ref)(initialData);
    const isLoading = (0, _vue.ref)(true);
    const hasSentReadyMessage = (0, _vue.ref)(false);
    const onChange = (mergedData)=>{
        data.value = mergedData;
        isLoading.value = false;
    };
    let subscription;
    (0, _vue.onMounted)(()=>{
        subscription = (0, _livepreview.subscribe)({
            apiRoute,
            callback: onChange,
            depth,
            initialData,
            serverURL
        });
        if (!hasSentReadyMessage.value) {
            hasSentReadyMessage.value = true;
            (0, _livepreview.ready)({
                serverURL
            });
        }
    });
    (0, _vue.onUnmounted)(()=>{
        (0, _livepreview.unsubscribe)(subscription);
    });
    return {
        data,
        isLoading
    };
};

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uL3NyYy9pbmRleC50cyJdLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgdHlwZSB7IFJlZiB9IGZyb20gJ3Z1ZSdcblxuaW1wb3J0IHsgcmVhZHksIHN1YnNjcmliZSwgdW5zdWJzY3JpYmUgfSBmcm9tICdAcGF5bG9hZGNtcy9saXZlLXByZXZpZXcnXG5pbXBvcnQgeyBvbk1vdW50ZWQsIG9uVW5tb3VudGVkLCByZWYgfSBmcm9tICd2dWUnXG5cbi8qKlxuICogVGhpcyBpcyBhIFZ1ZSBjb21wb3NhYmxlIHRvIGltcGxlbWVudCB7QGxpbmsgaHR0cHM6Ly9wYXlsb2FkY21zLmNvbS9kb2NzL2xpdmUtcHJldmlldy9vdmVydmlldyBQYXlsb2FkIExpdmUgUHJldmlld30uXG4gKlxuICogQGxpbmsgaHR0cHM6Ly9wYXlsb2FkY21zLmNvbS9kb2NzL2xpdmUtcHJldmlldy9mcm9udGVuZFxuICovXG5leHBvcnQgY29uc3QgdXNlTGl2ZVByZXZpZXcgPSA8VCBleHRlbmRzIFJlY29yZDxzdHJpbmcsIGFueT4+KHByb3BzOiB7XG4gIGFwaVJvdXRlPzogc3RyaW5nXG4gIGRlcHRoPzogbnVtYmVyXG4gIC8qKlxuICAgKiBUbyBwcmV2ZW50IHRoZSBmbGlja2VyIG9mIG1pc3NpbmcgZGF0YSBvbiBpbml0aWFsIGxvYWQsXG4gICAqIHlvdSBjYW4gcGFzcyBpbiB0aGUgaW5pdGlhbCBwYWdlIGRhdGEgZnJvbSB0aGUgc2VydmVyLlxuICAgKi9cbiAgaW5pdGlhbERhdGE6IFRcbiAgc2VydmVyVVJMOiBzdHJpbmdcbn0pOiB7XG4gIGRhdGE6IFJlZjxUPlxuICAvKipcbiAgICogVG8gcHJldmVudCB0aGUgZmxpY2tlciBvZiBzdGFsZSBkYXRhIHdoaWxlIHRoZSBwb3N0IG1lc3NhZ2UgaXMgYmVpbmcgc2VudCxcbiAgICogeW91IGNhbiBjb25kaXRpb25hbGx5IHJlbmRlciBsb2FkaW5nIFVJIGJhc2VkIG9uIHRoZSBgaXNMb2FkaW5nYCBzdGF0ZS5cbiAgICovXG4gIGlzTG9hZGluZzogUmVmPGJvb2xlYW4+XG59ID0+IHtcbiAgY29uc3QgeyBhcGlSb3V0ZSwgZGVwdGgsIGluaXRpYWxEYXRhLCBzZXJ2ZXJVUkwgfSA9IHByb3BzXG4gIGNvbnN0IGRhdGEgPSByZWYoaW5pdGlhbERhdGEpIGFzIFJlZjxUPlxuICBjb25zdCBpc0xvYWRpbmcgPSByZWYodHJ1ZSlcbiAgY29uc3QgaGFzU2VudFJlYWR5TWVzc2FnZSA9IHJlZihmYWxzZSlcblxuICBjb25zdCBvbkNoYW5nZSA9IChtZXJnZWREYXRhOiBUKSA9PiB7XG4gICAgZGF0YS52YWx1ZSA9IG1lcmdlZERhdGFcbiAgICBpc0xvYWRpbmcudmFsdWUgPSBmYWxzZVxuICB9XG5cbiAgbGV0IHN1YnNjcmlwdGlvbjogKGV2ZW50OiBNZXNzYWdlRXZlbnQpID0+IFByb21pc2U8dm9pZD4gfCB2b2lkXG5cbiAgb25Nb3VudGVkKCgpID0+IHtcbiAgICBzdWJzY3JpcHRpb24gPSBzdWJzY3JpYmUoe1xuICAgICAgYXBpUm91dGUsXG4gICAgICBjYWxsYmFjazogb25DaGFuZ2UsXG4gICAgICBkZXB0aCxcbiAgICAgIGluaXRpYWxEYXRhLFxuICAgICAgc2VydmVyVVJMLFxuICAgIH0pXG5cbiAgICBpZiAoIWhhc1NlbnRSZWFkeU1lc3NhZ2UudmFsdWUpIHtcbiAgICAgIGhhc1NlbnRSZWFkeU1lc3NhZ2UudmFsdWUgPSB0cnVlXG5cbiAgICAgIHJlYWR5KHtcbiAgICAgICAgc2VydmVyVVJMLFxuICAgICAgfSlcbiAgICB9XG4gIH0pXG5cbiAgb25Vbm1vdW50ZWQoKCkgPT4ge1xuICAgIHVuc3Vic2NyaWJlKHN1YnNjcmlwdGlvbilcbiAgfSlcblxuICByZXR1cm4ge1xuICAgIGRhdGEsXG4gICAgaXNMb2FkaW5nLFxuICB9XG59XG4iXSwibmFtZXMiOlsidXNlTGl2ZVByZXZpZXciLCJwcm9wcyIsImFwaVJvdXRlIiwiZGVwdGgiLCJpbml0aWFsRGF0YSIsInNlcnZlclVSTCIsImRhdGEiLCJyZWYiLCJpc0xvYWRpbmciLCJoYXNTZW50UmVhZHlNZXNzYWdlIiwib25DaGFuZ2UiLCJtZXJnZWREYXRhIiwidmFsdWUiLCJzdWJzY3JpcHRpb24iLCJvbk1vdW50ZWQiLCJzdWJzY3JpYmUiLCJjYWxsYmFjayIsInJlYWR5Iiwib25Vbm1vdW50ZWQiLCJ1bnN1YnNjcmliZSJdLCJtYXBwaW5ncyI6Ijs7OzsrQkFVYUE7OztlQUFBQTs7OzZCQVJpQztxQkFDRjtBQU9yQyxNQUFNQSxpQkFBaUIsQ0FBZ0NDO0lBaUI1RCxNQUFNLEVBQUVDLFFBQVEsRUFBRUMsS0FBSyxFQUFFQyxXQUFXLEVBQUVDLFNBQVMsRUFBRSxHQUFHSjtJQUNwRCxNQUFNSyxPQUFPQyxJQUFBQSxRQUFHLEVBQUNIO0lBQ2pCLE1BQU1JLFlBQVlELElBQUFBLFFBQUcsRUFBQztJQUN0QixNQUFNRSxzQkFBc0JGLElBQUFBLFFBQUcsRUFBQztJQUVoQyxNQUFNRyxXQUFXLENBQUNDO1FBQ2hCTCxLQUFLTSxLQUFLLEdBQUdEO1FBQ2JILFVBQVVJLEtBQUssR0FBRztJQUNwQjtJQUVBLElBQUlDO0lBRUpDLElBQUFBLGNBQVMsRUFBQztRQUNSRCxlQUFlRSxJQUFBQSxzQkFBUyxFQUFDO1lBQ3ZCYjtZQUNBYyxVQUFVTjtZQUNWUDtZQUNBQztZQUNBQztRQUNGO1FBRUEsSUFBSSxDQUFDSSxvQkFBb0JHLEtBQUssRUFBRTtZQUM5Qkgsb0JBQW9CRyxLQUFLLEdBQUc7WUFFNUJLLElBQUFBLGtCQUFLLEVBQUM7Z0JBQ0paO1lBQ0Y7UUFDRjtJQUNGO0lBRUFhLElBQUFBLGdCQUFXLEVBQUM7UUFDVkMsSUFBQUEsd0JBQVcsRUFBQ047SUFDZDtJQUVBLE9BQU87UUFDTFA7UUFDQUU7SUFDRjtBQUNGIn0=