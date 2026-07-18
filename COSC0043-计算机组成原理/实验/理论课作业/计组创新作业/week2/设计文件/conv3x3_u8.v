module conv3x3_u8 (
    input [7:0] p00, p01, p02,
    input [7:0] p10, p11, p12,
    input [7:0] p20, p21, p22,

    input [7:0] k00, k01, k02,
    input [7:0] k10, k11, k12,
    input [7:0] k20, k21, k22,

    output [19:0] y
);

wire [15:0] m00_16, m01_16, m02_16;
wire [15:0] m10_16, m11_16, m12_16;
wire [15:0] m20_16, m21_16, m22_16;

wire [19:0] m00, m01, m02;
wire [19:0] m10, m11, m12;
wire [19:0] m20, m21, m22;

wire [19:0] s0, s1, s2, s3, s4, s5, s6;

// 9个乘法
mul8u u_mul00 (.a(p00), .b(k00), .y(m00_16));
mul8u u_mul01 (.a(p01), .b(k01), .y(m01_16));
mul8u u_mul02 (.a(p02), .b(k02), .y(m02_16));

mul8u u_mul10 (.a(p10), .b(k10), .y(m10_16));
mul8u u_mul11 (.a(p11), .b(k11), .y(m11_16));
mul8u u_mul12 (.a(p12), .b(k12), .y(m12_16));

mul8u u_mul20 (.a(p20), .b(k20), .y(m20_16));
mul8u u_mul21 (.a(p21), .b(k21), .y(m21_16));
mul8u u_mul22 (.a(p22), .b(k22), .y(m22_16));

// 16位扩展为20位
assign m00 = {4'b0000, m00_16};
assign m01 = {4'b0000, m01_16};
assign m02 = {4'b0000, m02_16};

assign m10 = {4'b0000, m10_16};
assign m11 = {4'b0000, m11_16};
assign m12 = {4'b0000, m12_16};

assign m20 = {4'b0000, m20_16};
assign m21 = {4'b0000, m21_16};
assign m22 = {4'b0000, m22_16};

// 9项累加
add20u u_add0 (.a(m00), .b(m01), .y(s0));
add20u u_add1 (.a(s0),  .b(m02), .y(s1));
add20u u_add2 (.a(s1),  .b(m10), .y(s2));
add20u u_add3 (.a(s2),  .b(m11), .y(s3));
add20u u_add4 (.a(s3),  .b(m12), .y(s4));
add20u u_add5 (.a(s4),  .b(m20), .y(s5));
add20u u_add6 (.a(s5),  .b(m21), .y(s6));
add20u u_add7 (.a(s6),  .b(m22), .y(y));

endmodule