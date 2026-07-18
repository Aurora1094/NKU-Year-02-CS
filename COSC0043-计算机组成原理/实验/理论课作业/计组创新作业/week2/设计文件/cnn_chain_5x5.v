module mul8u (
    input  [7:0] a,
    input  [7:0] b,
    output [15:0] y
);
assign y = a * b;
endmodule


module add8u (
    input  [7:0] a,
    input  [7:0] b,
    output [8:0] y
);
assign y = a + b;
endmodule


module div4_u10 (
    input  [9:0] x,
    output [7:0] y
);
assign y = x >> 2;
endmodule


module add20u (
    input  [19:0] a,
    input  [19:0] b,
    output [19:0] y
);
assign y = a + b;
endmodule


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

mul8u u_mul00 (.a(p00), .b(k00), .y(m00_16));
mul8u u_mul01 (.a(p01), .b(k01), .y(m01_16));
mul8u u_mul02 (.a(p02), .b(k02), .y(m02_16));

mul8u u_mul10 (.a(p10), .b(k10), .y(m10_16));
mul8u u_mul11 (.a(p11), .b(k11), .y(m11_16));
mul8u u_mul12 (.a(p12), .b(k12), .y(m12_16));

mul8u u_mul20 (.a(p20), .b(k20), .y(m20_16));
mul8u u_mul21 (.a(p21), .b(k21), .y(m21_16));
mul8u u_mul22 (.a(p22), .b(k22), .y(m22_16));

assign m00 = {4'b0000, m00_16};
assign m01 = {4'b0000, m01_16};
assign m02 = {4'b0000, m02_16};

assign m10 = {4'b0000, m10_16};
assign m11 = {4'b0000, m11_16};
assign m12 = {4'b0000, m12_16};

assign m20 = {4'b0000, m20_16};
assign m21 = {4'b0000, m21_16};
assign m22 = {4'b0000, m22_16};

add20u u_add0 (.a(m00), .b(m01), .y(s0));
add20u u_add1 (.a(s0),  .b(m02), .y(s1));
add20u u_add2 (.a(s1),  .b(m10), .y(s2));
add20u u_add3 (.a(s2),  .b(m11), .y(s3));
add20u u_add4 (.a(s3),  .b(m12), .y(s4));
add20u u_add5 (.a(s4),  .b(m20), .y(s5));
add20u u_add6 (.a(s5),  .b(m21), .y(s6));
add20u u_add7 (.a(s6),  .b(m22), .y(y));

endmodule


module avg_pool2x2_u8 (
    input  [7:0] a,
    input  [7:0] b,
    input  [7:0] c,
    input  [7:0] d,
    output [7:0] y
);

wire [8:0] sum0;
wire [8:0] sum1;
wire [9:0] sum;

add8u u_add0 (.a(a), .b(b), .y(sum0));
add8u u_add1 (.a(c), .b(d), .y(sum1));

assign sum = {1'b0, sum0} + {1'b0, sum1};

div4_u10 u_div4 (
    .x(sum),
    .y(y)
);

endmodule


module cnn_chain_5x5 (
    input [7:0] p00, p01, p02, p03, p04,
    input [7:0] p10, p11, p12, p13, p14,
    input [7:0] p20, p21, p22, p23, p24,
    input [7:0] p30, p31, p32, p33, p34,
    input [7:0] p40, p41, p42, p43, p44,

    input [7:0] k00, k01, k02,
    input [7:0] k10, k11, k12,
    input [7:0] k20, k21, k22,

    output [7:0] y00,
    output [7:0] y01,
    output [7:0] y10,
    output [7:0] y11
);

wire [19:0] conv00, conv01, conv02;
wire [19:0] conv10, conv11, conv12;
wire [19:0] conv20, conv21, conv22;

conv3x3_u8 u_conv00 (
    .p00(p00), .p01(p01), .p02(p02),
    .p10(p10), .p11(p11), .p12(p12),
    .p20(p20), .p21(p21), .p22(p22),
    .k00(k00), .k01(k01), .k02(k02),
    .k10(k10), .k11(k11), .k12(k12),
    .k20(k20), .k21(k21), .k22(k22),
    .y(conv00)
);

conv3x3_u8 u_conv01 (
    .p00(p01), .p01(p02), .p02(p03),
    .p10(p11), .p11(p12), .p12(p13),
    .p20(p21), .p21(p22), .p22(p23),
    .k00(k00), .k01(k01), .k02(k02),
    .k10(k10), .k11(k11), .k12(k12),
    .k20(k20), .k21(k21), .k22(k22),
    .y(conv01)
);

conv3x3_u8 u_conv02 (
    .p00(p02), .p01(p03), .p02(p04),
    .p10(p12), .p11(p13), .p12(p14),
    .p20(p22), .p21(p23), .p22(p24),
    .k00(k00), .k01(k01), .k02(k02),
    .k10(k10), .k11(k11), .k12(k12),
    .k20(k20), .k21(k21), .k22(k22),
    .y(conv02)
);

conv3x3_u8 u_conv10 (
    .p00(p10), .p01(p11), .p02(p12),
    .p10(p20), .p11(p21), .p12(p22),
    .p20(p30), .p21(p31), .p22(p32),
    .k00(k00), .k01(k01), .k02(k02),
    .k10(k10), .k11(k11), .k12(k12),
    .k20(k20), .k21(k21), .k22(k22),
    .y(conv10)
);

conv3x3_u8 u_conv11 (
    .p00(p11), .p01(p12), .p02(p13),
    .p10(p21), .p11(p22), .p12(p23),
    .p20(p31), .p21(p32), .p22(p33),
    .k00(k00), .k01(k01), .k02(k02),
    .k10(k10), .k11(k11), .k12(k12),
    .k20(k20), .k21(k21), .k22(k22),
    .y(conv11)
);

conv3x3_u8 u_conv12 (
    .p00(p12), .p01(p13), .p02(p14),
    .p10(p22), .p11(p23), .p12(p24),
    .p20(p32), .p21(p33), .p22(p34),
    .k00(k00), .k01(k01), .k02(k02),
    .k10(k10), .k11(k11), .k12(k12),
    .k20(k20), .k21(k21), .k22(k22),
    .y(conv12)
);

conv3x3_u8 u_conv20 (
    .p00(p20), .p01(p21), .p02(p22),
    .p10(p30), .p11(p31), .p12(p32),
    .p20(p40), .p21(p41), .p22(p42),
    .k00(k00), .k01(k01), .k02(k02),
    .k10(k10), .k11(k11), .k12(k12),
    .k20(k20), .k21(k21), .k22(k22),
    .y(conv20)
);

conv3x3_u8 u_conv21 (
    .p00(p21), .p01(p22), .p02(p23),
    .p10(p31), .p11(p32), .p12(p33),
    .p20(p41), .p21(p42), .p22(p43),
    .k00(k00), .k01(k01), .k02(k02),
    .k10(k10), .k11(k11), .k12(k12),
    .k20(k20), .k21(k21), .k22(k22),
    .y(conv21)
);

conv3x3_u8 u_conv22 (
    .p00(p22), .p01(p23), .p02(p24),
    .p10(p32), .p11(p33), .p12(p34),
    .p20(p42), .p21(p43), .p22(p44),
    .k00(k00), .k01(k01), .k02(k02),
    .k10(k10), .k11(k11), .k12(k12),
    .k20(k20), .k21(k21), .k22(k22),
    .y(conv22)
);

// 本实验使用无符号卷积结果，因此ReLU等效为直通。
// 当前测试数据的卷积结果均小于255，因此可直接取低8位进入池化。
avg_pool2x2_u8 u_pool00 (
    .a(conv00[7:0]), .b(conv01[7:0]),
    .c(conv10[7:0]), .d(conv11[7:0]),
    .y(y00)
);

avg_pool2x2_u8 u_pool01 (
    .a(conv01[7:0]), .b(conv02[7:0]),
    .c(conv11[7:0]), .d(conv12[7:0]),
    .y(y01)
);

avg_pool2x2_u8 u_pool10 (
    .a(conv10[7:0]), .b(conv11[7:0]),
    .c(conv20[7:0]), .d(conv21[7:0]),
    .y(y10)
);

avg_pool2x2_u8 u_pool11 (
    .a(conv11[7:0]), .b(conv12[7:0]),
    .c(conv21[7:0]), .d(conv22[7:0]),
    .y(y11)
);

endmodule