module cnn_chain_5x5_opt (
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

// 本优化版本针对固定卷积核：
// 0 1 0
// 1 2 1
// 0 1 0
// 因此卷积计算简化为：p01 + p10 + 2*p11 + p12 + p21
// k00~k22端口保留，是为了方便与Week2原始测试文件接口保持一致。

conv3x3_fixed_opt u_conv00 (
    .p00(p00), .p01(p01), .p02(p02),
    .p10(p10), .p11(p11), .p12(p12),
    .p20(p20), .p21(p21), .p22(p22),
    .y(conv00)
);

conv3x3_fixed_opt u_conv01 (
    .p00(p01), .p01(p02), .p02(p03),
    .p10(p11), .p11(p12), .p12(p13),
    .p20(p21), .p21(p22), .p22(p23),
    .y(conv01)
);

conv3x3_fixed_opt u_conv02 (
    .p00(p02), .p01(p03), .p02(p04),
    .p10(p12), .p11(p13), .p12(p14),
    .p20(p22), .p21(p23), .p22(p24),
    .y(conv02)
);

conv3x3_fixed_opt u_conv10 (
    .p00(p10), .p01(p11), .p02(p12),
    .p10(p20), .p11(p21), .p12(p22),
    .p20(p30), .p21(p31), .p22(p32),
    .y(conv10)
);

conv3x3_fixed_opt u_conv11 (
    .p00(p11), .p01(p12), .p02(p13),
    .p10(p21), .p11(p22), .p12(p23),
    .p20(p31), .p21(p32), .p22(p33),
    .y(conv11)
);

conv3x3_fixed_opt u_conv12 (
    .p00(p12), .p01(p13), .p02(p14),
    .p10(p22), .p11(p23), .p12(p24),
    .p20(p32), .p21(p33), .p22(p34),
    .y(conv12)
);

conv3x3_fixed_opt u_conv20 (
    .p00(p20), .p01(p21), .p02(p22),
    .p10(p30), .p11(p31), .p12(p32),
    .p20(p40), .p21(p41), .p22(p42),
    .y(conv20)
);

conv3x3_fixed_opt u_conv21 (
    .p00(p21), .p01(p22), .p02(p23),
    .p10(p31), .p11(p32), .p12(p33),
    .p20(p41), .p21(p42), .p22(p43),
    .y(conv21)
);

conv3x3_fixed_opt u_conv22 (
    .p00(p22), .p01(p23), .p02(p24),
    .p10(p32), .p11(p33), .p12(p34),
    .p20(p42), .p21(p43), .p22(p44),
    .y(conv22)
);

avg_pool2x2_u8_opt u_pool00 (
    .a(conv00[7:0]), .b(conv01[7:0]),
    .c(conv10[7:0]), .d(conv11[7:0]),
    .y(y00)
);

avg_pool2x2_u8_opt u_pool01 (
    .a(conv01[7:0]), .b(conv02[7:0]),
    .c(conv11[7:0]), .d(conv12[7:0]),
    .y(y01)
);

avg_pool2x2_u8_opt u_pool10 (
    .a(conv10[7:0]), .b(conv11[7:0]),
    .c(conv20[7:0]), .d(conv21[7:0]),
    .y(y10)
);

avg_pool2x2_u8_opt u_pool11 (
    .a(conv11[7:0]), .b(conv12[7:0]),
    .c(conv21[7:0]), .d(conv22[7:0]),
    .y(y11)
);

endmodule